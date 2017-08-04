module.exports = function makeFormatAliases (argumentConfig) {
  return (opt) => {
    const aliases = argumentConfig.alias[opt]
    const flags = aliases.map((a) => a.length === 1 ? `-${a}` : `--${a}`)
    return `[or ${flags.join(', ')}]`
  }
}
