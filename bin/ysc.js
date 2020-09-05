#!/usr/bin/env node
const path = require('path');
const fse = require('fs-extra');
const inquirer = require('inquirer');
const { Command } = require('commander');
const ejs = require('ejs');
const logSymbols = require('log-symbols');
const chalk = require('chalk');

const PROGRAM_VERSION = require('../package.json').version;
const program = new Command();

// 设置程序选项
program
  .version('v' + PROGRAM_VERSION, '-v, --version', 'print ysc version')
  .option('-ts, --typescript [boolean]', 'use typescript template', false)

// 设置程序命令
program
  .command('create <project>')
  .description('create a new project')
  .action(async (projectFolderName) => {
    const answers = await inquirer
      .prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'your project name',
          default: projectFolderName
        },
        {
          type: 'confirm',
          name: 'typescript',
          message: 'use typescript',
          default: program.typescript
        }
      ])
    const { projectName, typescript } = answers;
    const projectDir = path.join(process.cwd(), projectFolderName);
    await fse.mkdirs(projectDir);
    let templateDir;
    if (typescript) {
      templateDir = path.join(__dirname, '../templates/ts-template');
    } else {
      templateDir = path.join(__dirname, '../templates/js-template');
    }
    copyTemplates(templateDir, projectDir, { projectFolderName, data: {projectName} });
    
  })

program.parse(process.argv);

// 复制模板文件
function copyTemplates(srcDir, destDir, projectData, config = { copyFilesCount: 0, copySuccessCount: 0, startTime: Date.now()}) {
  fse.readdir(srcDir, (err, files) => {
    if (err) throw err;
    files.forEach(async (item) => {
      const src = path.join(srcDir, item);
      const dest = path.join(destDir, item)
      const stat = fse.statSync(src);
      if (stat.isFile()) {
        config.copyFilesCount++;
        ejs.renderFile(src, projectData.data, (err, result) => {
          if (err) throw err;
          fse.writeFile(dest, result)
            .then(() => {
              config.copySuccessCount++;
              console.log(logSymbols.success, `${dest} created!`);
              if (config.copySuccessCount === config.copyFilesCount) {
                const totalTime = (Date.now() - config.startTime) / 1000;
                console.log('\n')
                console.log(logSymbols.success, 'project created successfully!')
                console.log('✨ ', `done in ${totalTime.toFixed(2)}s`);
                console.log(chalk.green("\nnow you can:"))
                console.log(chalk.blue(`\ncd ${projectData.projectFolderName}`))
                console.log(`\n${chalk.blueBright('yarn')}  or  ${chalk.blueBright('npm install')}`)
                console.log(`\n${chalk.blueBright('yarn start')}  or  ${chalk.blueBright('npm run start')} \n`)
              }
            })
            .catch(err => {
              throw err;
            })
        })
      }
      if (stat.isDirectory()) {
        await fse.mkdirs(dest);
        copyTemplates(src, dest, projectData, config);
      }
    })
  })
}