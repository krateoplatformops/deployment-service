const read = require('./read.path')
const create = require('./create.path')
const remove = require('./delete.path')
const createImport = require('./create.import.path')
const readId = require('./read.id.path')
const readIdPlugins = require('./read.id.plugins.path')

module.exports = {
  read,
  create,
  delete: remove,
  import: createImport,
  readId,
  readIdPlugins
}
