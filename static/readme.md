# What's in the static folder?

All the files you can access in url are listed here, for example the **image.jpg file placed here** by default will be available at **localhost/image.jpg** or **domain.com/image.jpg** url.

You can also add a folder or subfolder here.

For example, using folder: **./static/test/image.jpg** will be available available at **localhost/test/image.jpg** or **domain.com/test/image.jpg** url.

For example, using subfolders: **./static/test/sub/subsubfolder/image.jpg** will be available available at **localhost/test/sub/subsubfolder/image.jpg** or **domain.com/test/sub/subsubfolder/image.jpg** url. You can use up to max 4 subfolders.

# Important

If you are using theme, this static folder will not be used. Then you need to go to source theme and the static folder will be the `/static` folder there, or if it is not there - the `views/src` folder.
