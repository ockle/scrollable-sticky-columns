# Scrollable Sticky Columns

A jQuery plugin that makes a column, or columns, remain in the viewport as the page is scrolled, while still allowing natural scrolling up and down the column. This is achieved by sticking the bottom/top of the column to the bottom/top of the viewport as the page is scrolled down/up. This is useful for layouts that have a sidebar with enough content that regular methods of sticking it in place would mean that the lower content is unviewable on a viewport of insufficient height.

This plugin **neither requires nor adds any additional markup**.

### View the [demo](http://ockle.github.com/scrollable-sticky-columns/demo.html)

## Usage

In its simplest usage, you can just call it like so:

```javascript
$(function() {
	$('.column').scrollableStickyColumns();
});
```

Points to note:

1. The plugin must be called on 2 or more columns
2. The columns must be in a common container
3. The container must be able to be the offset parent to all columns

Recommendations:

1. Although by no means required, it is advised try to make the columns as close to being direct descendants of the container as possible
2. If images of are loaded in to the columns in such a way that they determine the size of the column after they have loaded, it is necessary to call this plugin on *window* load rather than document load.

## Options

These are passed to the plugin via an object literal as the first parameter.

| Option | Description |
|--------|-------------|
| `container` | Optionally specify a selector or jQuery element to use as the container. If not given, the plugin will find the first common parent of all columns. |
| `topStop` | The number of pixels gap you would like between the top of the column and the top of the viewport when the column is stuck and the page is being scrolled up. Defaults to the initial distance between the top of the tallest column and the inside top of the container. Negative values are permitted. |
| `bottomStop` | The number of pixels gap you would like between the bottom of the column and the bottom of the viewport when the column is stuck and the page is being scrolled down. Defaults to the initial distance between the bottom of the tallest column and the inside bottom of the container. Negative values are permitted. |

## Methods

These are called on the object returned from the initial plugin call like the one demonstrated in the usage section.

| Method | Description |
|--------|-------------|
| `remove` | Removes the plugin from the elements. Columns will go back to where they would be i.e. they don't stay scrolled down. The `style` attribute of the columns and the container is set back to what it was when the plugin was initialised. This means care should be taken in case anything has since made changes to this attribute. |
| `init` | (Re)initialises the plugin. If you assign the result of the plugin call to a variable, you can then call e.g. `scrollableStickyColumns.init()` to reactivate the plugin after a call to `remove`. Recalling the plugin will not work. |

## Events

This plugin makes a number of events available for you to listen for:

| Event | Description |
|-------|-------------|
| `stuckToBottom.scrollableStickyColumns` | Triggered when the page is being scrolled down and the bottom of the column sticks to the bottom of the viewport. |
| `stuckToTop.scrollableStickyColumns` | Triggered when the page is being scrolled up and the top of the column sticks to the top of the viewport. |
| `unstuckFromBottom.scrollableStickyColumns` | Triggered when the page is scrolled back up and a column that was stuck to the bottom of the viewport no longer is. |
| `unstuckFromTop.scrollableStickyColumns` | Triggered when the page is scrolled back down and a column that was stuck to the top of the viewport no longer is. |
| `reachedBottomOfContainer.scrollableStickyColumns` | Triggered when the bottom of the column reaches the bottom of the container and the column stops scrolling down. |
| `reachedTopOfContainer.scrollableStickyColumns` | Triggered when the top of the column reaches the top of the container and the column stops scrolling up. |

## License

This plugin is released under the MIT license.