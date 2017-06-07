const { makeServer } = require('./main');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

module.exports = {
  name: '@cardstack/hub',

  included(){
    this._super.apply(this, arguments);
    this.seedPath = path.join(path.dirname(this.project.configPath()), '..', 'cardstack', 'seeds');
  },

  // The serverMiddleware hook is well-behaved and will wait for us to
  // resolve a promise before moving on.
  async serverMiddleware({ app, options }) {
    let { pkg } = this.project;

    // the hub should only boot up in development mode if its in
    // `dependencies`, meaning it's a runtime dependency
    if (pkg.dependencies && pkg.dependencies['@cardstack/hub']) {
      let { project, environment } = options;
      let seedDir = path.join(this.seedPath, environment);
      app.use('/cardstack', await this._middleware(seedDir, project.ui));
    }
  },

  // testemMiddleware will not wait for a promise, so we need to
  // register something immediately. This is racy and makes it
  // possible for early requests to fail -- if that turns out to have
  // a practical effect we will need to queue requests here instead.
  testemMiddleware(app) {
    let seedDir = path.join(this.seedPath, 'test');
    let handler;
    this._middleware(seedDir, null, true).then(h => handler = h);
    app.use('/cardstack', (req, res) => {
      if (handler) {
        handler(req, res);
      } else {
        res.status = 500;
        res.send("Server not ready yet");
        res.end();
      }
    });
  },

  _middleware(seedDir, ui, isTesting) {
    let seedModels;
    try {
      seedModels = fs.readdirSync(seedDir).map(filename => require(path.join(seedDir, filename))).reduce((a,b) => a.concat(b), []);
    } catch (err) {
      if (ui) {
        ui.writeWarnLine(`Unable to load your seed models (looking for ${seedDir})`);
      } else {
        process.stderr.write(`Unable to load your seed models (looking for ${seedDir})\n`);
      }
      seedModels = [];
    }

    // Without this node 7 swallows stack traces within the native
    // promises I'm using.
    process.on('warning', (warning) => {
      process.stderr.write(warning.stack);
    });

    // Randomized session encryption -- this means if you restart the
    // dev server your session gets invalidated.
    let sessionsKey = crypto.randomBytes(32);
    return makeServer(this.project.root, sessionsKey, seedModels, isTesting).then(server => {
      return server.callback();
    });
  }

};
