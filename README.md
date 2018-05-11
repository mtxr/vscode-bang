# Bang!

> Under development...

## History

One day a friend of mine expert in Vim told me that VSCode would not be able to run shell commands like Vim.

Sorry friend, yes, we can!

## Usage

Call command palette, select `Bang! Run command and insert`, type your shell statment and BANG!

You can also run commands that doesn't insert any text with `Bang! Run command`.

You can refer to the current opened file as `%`. Eg. `cat % | grep 'text' > newfile`.

If you have selections, each selected range will be piped (not realy piped, but..) to you command.

Eg. `echo "Selected text\nOther line from selection" | sort -r`
