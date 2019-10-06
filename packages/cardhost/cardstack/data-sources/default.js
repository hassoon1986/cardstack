
module.exports = [
  {
    type: 'data-sources',
    id: 'default',
    attributes: {
      'source-type': '@cardstack/ephemeral'
    }
  },
  {
    type: 'plugin-configs',
    id: '@cardstack/hub',
    relationships: {
      'default-data-source': {
        data: { type: 'data-sources', id: 'default' }
      }
    }
  },


  // TODO this is for testing only--eventually we should
  // only use mock-auth in the development and test environments
  {
    type: 'data-sources',
    id: 'mock-auth',
    attributes: {
      'source-type': '@cardstack/mock-auth',
      params: {
        users: {
          user1: {
            name: 'Carl Stack',
            email: 'carlstack@cardstack.com',
            verified: true
          }
        }
      }
    }
  }
];