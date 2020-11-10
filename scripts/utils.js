import fs from "fs";
import path from "path";
import chalk from "chalk";

export const style = {
  error: chalk.bold.red,
  warning: chalk.keyword("orange"),
  success: chalk.greenBright,
  info: chalk.grey,
  header: chalk.bold.underline.hex("#e8e8e8"),
  cmd: chalk.hex("#808080"),
  green: chalk.green,
};

export const VERSION = "_VERSION_";

const resolve = (fileOrDir = "./") => path.resolve(process.cwd(), fileOrDir);

const resolveInternal = (fileOrDir = "./") =>
  path.resolve(__dirname, fileOrDir);

const emptyDir = (dir) => !fs.existsSync(dir) || fs.readdirSync(dir).length < 1;

const mkdir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const Logger = new Proxy(
  {},
  {
    get(target, prop) {
      if (prop in style) {
        return (msg) => console.log(style[prop](msg));
      }
      if (prop === "log") {
        return console.log;
      }
      return target[prop];
    },
  }
);

export class Filer {
  constructor(path = "./") {
    if (path instanceof Filer) {
      const { _path, _contents } = path;
      this._path = _path;
      this._internalPath = _path;
      this._contents = _contents;
    } else {
      this._path = path;
      this._internalPath = path;
      this._contents = "";
    }
    this._error = null;
    this._skip = false;
    this._local = true;
    this.log = Logger;
  }
  pause() {
    this._skip = true;
    return this;
  }
  resume() {
    this._skip = false;
    return this;
  }
  ifEmpty() {
    if (this._contents) {
      this.pause();
    } else {
      this.resume();
    }
    return this;
  }
  unlessEmpty() {
    if (this._contents) {
      this.resume();
    } else {
      this.pause();
    }
    return this;
  }
  ifError() {
    if (this._error) {
      this.resume();
    } else {
      this.pause();
    }
    return this;
  }
  ifSuccess() {
    if (this._error) {
      this.pause();
    } else {
      this.resume();
    }
    return this;
  }
  local() {
    if (!this._skip) {
      this._local = true;
    }
    return this;
  }
  internal() {
    if (!this._skip) {
      this._local = false;
    }
    return this;
  }
  get error() {
    return this._error;
  }
  ignoreError() {
    this._error = null;
    this._skip = false;
    return this;
  }
  join(pathStr) {
    if (!this._skip) {
      try {
        this.current = [...this.current.split("/"), pathStr].join("/");
      } catch (err) {
        this._error = err;
        this._skip = true;
      }
    }
    return this;
  }
  get data() {
    return this._contents;
  }
  get current() {
    return this._local ? this._path : this._internalPath;
  }
  set current(value) {
    if (this._local) {
      this._path = value;
    } else {
      this._internalPath = value;
    }
  }
  set(value) {
    this.current = value;
    return this;
  }
  pop() {
    if (!this._skip) {
      try {
        const parts = this.current.split();
        parts.pop();
        this.current = parts.join("/");
      } catch (err) {
        this._error = err;
        this._skip = true;
      }
    }
    return this;
  }
  read() {
    if (!this._skip) {
      try {
        this._contents = fs.readFileSync(this.toString(), "utf8");
      } catch (err) {
        this._error = err;
        this._skip = true;
      }
    }
    return this;
  }
  write() {
    if (!this._skip) {
      try {
        fs.writeFileSync(this.toString(), this._contents);
      } catch (err) {
        this._error = err;
        this._skip = true;
      }
    }
    return this;
  }
  dir() {
    if (!this._skip) {
      try {
        const dirPath = this.toString();
        if (emptyDir(dirPath)) {
          mkdir(dirPath);
        } else {
          throw new Error(
            `Failed to create dir at path '${dirPath}'. Ensure the path does not already contain a non empty dir.`
          );
        }
      } catch (err) {
        this._error = err;
        this._skip = true;
      }
    }
    return this;
  }
  toJson() {
    if (!this._skip) {
      try {
        this._contents = JSON.stringify(this._contents, null, 2);
      } catch (err) {
        this._error = err;
        this._skip = true;
      }
    }
    return this;
  }
  fromJson() {
    if (!this._skip) {
      try {
        this._contents = JSON.parse(this._contents || "{}");
      } catch (err) {
        this._error = err;
        this._skip = true;
      }
    }
    return this;
  }
  contents(content = "") {
    if (!this._skip) {
      try {
        if (typeof content === "function") {
          this._contents = content(this._contents);
        } else {
          this._contents = content;
        }
      } catch (err) {
        this._error = err;
        this._skip = true;
      }
    }
    return this;
  }
  run(callable) {
    if (!this._skip) {
      try {
        if (typeof callable === "function") {
          callable(this);
        }
      } catch (err) {
        this._error = err;
        this._skip = true;
      }
    }
    return this;
  }
  toString() {
    return this._local
      ? resolve(this._path)
      : resolveInternal(this._internalPath);
  }
}
