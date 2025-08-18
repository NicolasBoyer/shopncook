module.exports = {
  apps: [{
    name: 'shopncook',
    script: 'src/back/prod.ts',
    interpreter: 'node',
    interpreter_args: '--import=tsx',
    watch: ['src/back'],
    ignore_watch: ["node_modules"],
  }]
}
