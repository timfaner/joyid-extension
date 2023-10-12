# joyid-extension

## file structure

```shell

├── README.md   # this file
├── dist        # build target
├── src         # source code
├── public      # publice file like pages, options
├── webpack     # webpage config files
├── package.json
├── tsconfig.json
├── type.d.ts
└── yarn.lock
```

### build

`yarn install ` then `yarn build ` , the unpacked extension will build in `dist/`

If you want publish in production mode , please use `yarn build:prod` instead.

### publich

Refer to [chrome guide](https://developer.chrome.com/docs/extensions/mv3/hosting/)
