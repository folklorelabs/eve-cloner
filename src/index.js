#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const yargsLib = require('yargs/yargs');

const copyRecursiveSync = require('./utils/copyRecursiveSync');
const getFileListingRecursiveSync = require('./utils/getFileListingRecursiveSync');
const getUserPaths = require('./utils/getUserPaths');

const CONFIG_PATH = path.join(process.cwd(), 'eve-settings-cloner-config.json');
const SETTING_FILE_REGEXP = /core_(user|char)_(\d+).dat$/;
const STATE = {
  root: '',
  user: {},
  char: {},
  userExclude: [],
  charExclude: [],
  verbose: false,
};

function log(msg) {
  if (!STATE.verbose) return;
  console.log(msg);
}

function backup(src) {
  log('CREATING BACKUP');
  const srcPath = path.resolve(src);
  const backupPath = `${path.dirname(srcPath)}/${path.basename(srcPath)}_backup${Date.now()}`;
  log(`  < ${srcPath}`);
  copyRecursiveSync(srcPath, backupPath);
  log(`  > ${backupPath}`);
  return backupPath;
}

function index() {
  log('INDEXING FILES');
  log(`  > ${STATE.src}`);
  const listing = getFileListingRecursiveSync(STATE.src);
  listing.forEach((p) => {
    const match = SETTING_FILE_REGEXP.exec(p);
    if (!match) return;
    const settingType = match[1];
    const settingId = match[2];
    if (STATE[`${settingType}Exclude`].includes(settingId)) return;
    STATE[settingType][settingId] = p;
  });
  log(`  > ${Object.keys(STATE.user).length} users and ${Object.keys(STATE.char).length} chars found`);
}

function dupe(settingsType, srcId) {
  log(`CLONING ${settingsType.toUpperCase()}S`);
  const srcPath = STATE[settingsType][srcId];
  if (!srcPath) throw new Error(`Source ${settingsType} id (${srcId}) cannot be found. Please ensure the "core_${settingsType}_${srcId}.dat" file exists in the source directory.`);
  Object.keys(STATE[settingsType]).forEach((targetId) => {
    const targetPath = STATE[settingsType][targetId];
    if (srcPath === targetPath) return;
    fs.copyFileSync(srcPath, targetPath);
    log(`  > ${targetPath}`);
  });
}

function findEvePaths(src = process.cwd()) {
  const trials = [
    '/AppData/Local/CCP/EVE',
    '/Library/Application Support/CCP/EVE',
  ];
  const viableOptions = getUserPaths(src).reduce((all, userDir) => {
    trials
      .map((p) => path.join(userDir, p))
      .filter((p) => fs.existsSync(p))
      .forEach((p) => all.push(p));
    return all;
  }, []);
  return viableOptions;
}

function findEveSettingsPaths(src = process.cwd()) {
  const eveSettingsPaths = findEvePaths(src);
  const viableOptions = eveSettingsPaths.reduce((all, evePath) => {
    const targetDirs = fs.readdirSync(evePath)
      .filter((p) => /(tranquility|singularity)/.test(p))
      .map((f) => path.resolve(evePath, f, 'settings_Default'))
      .filter((p) => fs.existsSync(p));
    return [
      ...all,
      ...targetDirs.filter((p) => /settings_Default$/.test(p)),
    ];
  }, []);
  return viableOptions;
}

function inquirerPromptAsync(promptQuestions) {
  return new Promise((resolve, reject) => {
    inquirer
      .prompt(promptQuestions)
      .then(resolve)
      .catch(reject);
  });
}

function getCliOptions() {
  const { argv } = yargsLib(process.argv.slice(2))
    .usage('Usage: $0 [--user <id>] [--char <id>] [-v]')
    .option('src', {
      describe: 'Source directory where EVE settings live. Usually "c/Users/<computerName>/AppData/Local/CCP/EVE/c_games_eve_sharedcache_tq_tranquility/settings_Default".',
    })
    .option('user', {
      describe: 'User id for cloning settings from (locate the "core_user_<userId>.dat" file).',
      type: 'string',
    })
    .option('char', {
      describe: 'Character id for cloning settings from (locate the "core_char_<charId>.dat" file)',
      type: 'string',
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with logging.',
    })
    .option('skip', {
      alias: 's',
      description: 'Bypass user input steps.',
      hidden: true,
    })
    .help('h')
    .alias('h', 'help');
  return argv;
}

async function getConfigOptions() {
  const configBuffer = fs.existsSync(CONFIG_PATH) && fs.readFileSync(CONFIG_PATH);
  const config = configBuffer && JSON.parse(configBuffer);
  if (config) {
    console.log(`\nConfig found\n  src=${config.src}\n  user=${config.user}\n  char=${config.char}\n`);
    const configInput = await inquirerPromptAsync([
      {
        name: 'useConfig',
        type: 'confirm',
        when: () => !!config,
        message: 'Use saved configuration?',
      },
    ]);
    if (configInput.useConfig) {
      return config;
    } else {
      return false;
    }
  }
  return null;
}

async function saveConfigOptions(userOptions) {
  const userInput = await inquirerPromptAsync([
    {
      name: 'saveConfig',
      type: 'confirm',
      message: 'Would you like to save these config settings for next time?',
      default: false,
    },
  ]);
  if (userInput.saveConfig) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(userOptions));
    return CONFIG_PATH;
  }
  return null;
}

const settingIdCache = {};
function getSettingsIds(dir, settingsType, useCache = true) {
  if (settingIdCache[settingsType] && useCache) return settingIdCache[settingsType];
  const exclusions = STATE[`${settingsType}Exclude`];
  const ids = getFileListingRecursiveSync(dir).filter((p) => {
    const match = SETTING_FILE_REGEXP.exec(p);
    return match && match[1] === settingsType && !exclusions.includes(match[2]);
  }).sort((a, b) => fs.lstatSync(b).mtimeMs - fs.lstatSync(a).mtimeMs).map((p) => {
    const match = SETTING_FILE_REGEXP.exec(p);
    return match[2];
  });
  settingIdCache[settingsType] = ids;
  return ids;
}

async function getUserOptions(defaultOptions) {
  const viableSrcs = findEveSettingsPaths();
  const userInput = await inquirerPromptAsync([
    {
      name: 'src',
      type: 'list',
      default: defaultOptions.src,
      message: 'Choose the EVE settings directory you would like to update:',
      choices: viableSrcs,
    },
    {
      name: 'user',
      type: 'list',
      choices: (answers) => getSettingsIds(answers.src, 'user'),
      default: (answers) => {
        if (defaultOptions.user) return defaultOptions.user;
        const ids = getSettingsIds(answers.src, 'user');
        return !!ids.length && ids[0];
      },
      message: 'EVE Account (user) to base setting cloning on:',
    },
    {
      name: 'char',
      type: 'list',
      choices: (answers) => getSettingsIds(answers.src, 'char'),
      default: (answers) => {
        if (defaultOptions.char) return defaultOptions.char;
        const ids = getSettingsIds(answers.src, 'char');
        return !!ids.length && ids[0];
      },
      message: 'EVE Character (char) to base setting cloning on:',
    },
    {
      name: 'userExclude',
      type: 'checkbox',
      choices: (answers) => getSettingsIds(answers.src, 'user'),
      message: 'EVE Accounts (user) to exclude from the cloning?',
    },
    {
      name: 'charExclude',
      type: 'checkbox',
      choices: (answers) => getSettingsIds(answers.src, 'char'),
      message: 'EVE Characters (char) to exclude from the cloning?',
    },
    {
      name: 'confirm',
      type: 'confirm',
      message: 'Ready to clone? Your existing EVE setting files will be backed up.',
    },
  ]);
  const userOptions = {
    src: userInput.src,
    char: userInput.char,
    user: userInput.user,
    userExclude: userInput.userExclude,
    charExclude: userInput.charExclude,
  };
  return userOptions;
}

function anykey() {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', process.exit.bind(process, 0));
}

(async () => {
  const cliOptions = getCliOptions();
  console.log('\nEVE SETTINGS CLONER - Clone your main character\'s EVE settings.\n');
  console.log('We won\'t modify anything until we\'ve finished asking questions.\n');
  const configOptions = await getConfigOptions();
  const userOptions = configOptions || await getUserOptions(cliOptions);
  STATE.verbose = cliOptions.verbose || STATE.verbose;
  STATE.src = userOptions.src || STATE.src;
  STATE.userExclude = userOptions.userExclude || STATE.userExclude;
  STATE.charExclude = userOptions.charExclude || STATE.charExclude;
  const backupPath = backup(userOptions.src);
  console.log(`Backup generated: "${backupPath}".`);
  index();
  dupe('user', userOptions.user);
  dupe('char', userOptions.char);
  if (!configOptions) {
    const configPath = await saveConfigOptions(userOptions);
    if (configPath) console.log(`Config saved: "${configPath}".`);
  }
  console.log('Clone successful. Press any key to exit.');
  await anykey();
})();
