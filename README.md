
# README


## About this fork

This project builds on [Visualizing Git](http://git-school.github.io/visualizing-git/) (repo 1), which itself is based on [explain-git-with-d3](https://github.com/onlywei/explain-git-with-d3) (repo 2). Both projects have been valuable resources for understanding Git internals through visualization.  

The aim of this fork is to extend the original work with newer Git commands and modern tooling, while preserving the spirit of the original visualization.  

Enhancements in this fork include:  
- Added support for the `git switch` command  
- Refactored the build system to use [Vite](https://vitejs.dev/) for a faster, modern development workflow  


## Visualize Git

Visualize Git illustrates what's going on underneath the hood when you use common Git operations. You'll see what exactly is happening to your commit graph. We aim to support all the most basic git operations, including interacting with remotes.

Here are some examples of the fun things you can do with it:

## Rebase
![rebase](images/viz-rebase.gif)

## Cherry-pick
![cherry-pick](images/cherry-pick.gif)

## Push/pull
![push-pull](images/remote.gif)

## Supported operations

Type `help` in the command box to see a list of supported operations

`pres()` = Turn on presenter mode<br>
`undo` = Undo the last git command<br>
`redo` = Redo the last undone git command<br>
`mode` = Change mode (`local` or `remote`)<br>
`clear` = Clear the history pane and reset the visualization

Available Git Commands:
```
git branch
git checkout
git cherry_pick
git commit
git fetch
git log
git merge
git pull
git push
git rebase
git reflog
git reset
git rev_parse
git revert
git tag
```


