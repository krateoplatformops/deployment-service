const moment = require('moment')

const currentTime = () => {
  return moment.utc().unix()
}

const daysAgo = (days) => {
  return moment()
    .utc()
    .add(days * -1, 'days')
    .startOf('day')
    .unix()
}

module.exports = {
  currentTime,
  daysAgo
}
