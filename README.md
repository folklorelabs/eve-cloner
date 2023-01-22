## EVE Settings Cloner

Clone your EVE settings across accounts and characters. This tool is a script that executes the old ["manually copy and paste your files" strategy](https://forums.eveonline.com/t/manually-copy-settings-between-characters-and-accounts/32704).

![image](https://user-images.githubusercontent.com/98740773/213911835-370d0a4f-d574-45ee-92bc-6ba56ee3027c.png)

### Running the app

Running the app will open a terminal and walk you through each step. The script will always back up your setting files and print out the backup location in case you need to revert.
#### [Download the latest release](https://github.com/folklorelabs/eve-settings-cloner/releases/latest)

### Getting the desired `char` and `user` ids

Try this if you are having trouble identifying the `user` and `char` ids you want to use for cloning:
1. Log into your main account and load up your main character.
2. Log out of the character and close the client (this will trigger the associated files to update).
3. Run `EVE Settings Cloner` and the top-most `user` and `char` will be the account and character that you just logged off.
    1. Alternatively you can open your [EVE settings directory](https://wiki.eveuniversity.org/Client_Preferences_and_Settings_Backup) and sort by "last modified". The top-most `core_user_<userId>.dat` and `core_char_<charId>.dat` files will have the id's you're looking for.

### Working with the binaries

#### Node

1. Install [Node](https://nodejs.org/)
2. (Optional) Install [nvm](https://github.com/nvm-sh/nvm)
3. Install package dependencies
```
npm i
```
4. Link binary package
```
npm link
```
5. Run script
```
npm run start
```

### Build

1. `npm run build`
