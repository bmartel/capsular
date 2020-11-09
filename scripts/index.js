#!/usr/bin/env node

import fs from "fs";
import path from "path";
import Listr from "listr";
import execa from "execa";
import tmp from "tmp";
import checkNodeVersion from "check-node-version";
import chalk from "chalk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { name, version, engines } from "../package.json";

const style = {
  error: chalk.bold.red,
  warning: chalk.keyword("orange"),
  success: chalk.greenBright,
  info: chalk.grey,
  header: chalk.bold.underline.hex("#e8e8e8"),
  cmd: chalk.hex("#808080"),
  green: chalk.green,
};

yargs.command().version(version).help().argv;
