If you want to help out with improving form-and-function then first, thank you very much!

At the moment the folder structure is a little odd, because this project started out as a create-react-app project, and that is 
still in place for the demos.  I'm somewhat fond of keeping the demos in the same repo because then any API breaking changes 
are very obvious, but if there is a compelling reason to change then let's talk.  The upshot of this is that the library code 
lives in the `src/lib` folder.

There are a couple of useful scripts in the `package.json`:

* `start` - starts the demo locally
* `build` - builds the library

The build process currently uses the Typescript compiler to get down to ES5 and emit declarations, but keep things in modules, 
then rollup to create bundles from these modules.  Probably a bit hacky, and something that needs improving but it works for now.

There is no tolerance of any anti-social behaviour of any form amongst anyone contributing to this project.  And I decide what 
anti-social means. Just be nice.
