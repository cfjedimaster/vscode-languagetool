### LanguageTool

This is a wrapper for the [LanguageTool](https://languagetool.org/) API. It provides basic grammar and spellchecking for your files. The main focus is on Markdown files and therefore I do some work stripping out front matter and then processing the resultant rendered Markdown versus the source (if that makes sense). Obviously this is rough - PR's are welcome!

The extension enables a command with the name: "Run LanguageTool". To run it, bind it to a keyboard shortcut in settings, or press "ctrl-shift-p" to open up the "Show and Run Commands Dialog". It will be listed upon install and reload there.

##### [VSCode Marketplace Page Here](https://marketplace.visualstudio.com/items?itemName=raymondcamden.languagetool)
##### [Blog Post here](https://www.raymondcamden.com/2018/06/18/my-first-stab-at-a-grammar-extension-for-vs-code)

![](https://res.cloudinary.com/dheqbiqti/image/upload/v1544546556/Screenshots/Untitled.png)
