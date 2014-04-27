/**
 * Scrollable Sticky Columns jQuery Plugin
 * 
 * @see https://github.com/ockle/scrollable-sticky-columns
 * @version 1.0.0
 * @author github.com/ockle
 * @license MIT
 */
;(function($, window, document, undefined) {
    function ScrollableStickyColumns(columns, settings) {
        this.columns = columns;
        this.settings = $.extend({}, settings);

        this.checkColumnsValidity();
        this.assignContainer();
        this.init();
    }

    ScrollableStickyColumns.prototype = {
        /**
         * Perform some checks on the columns before allowing instantiation
         */
        checkColumnsValidity: function() {
            if (this.columns.length < 2) {
                throw 'This function must be called on 2 or more elements';
            }

            this.columns.each(function() {
                if ($(this).data('scrollableStickyColumns') !== undefined) {
                    throw 'Cannot call this function more than once on the same element';
                }
            });

            return true;
        },

        /**
         * Assign the container base on either the specified selector,
         * or the first common parene of the first two columns
         */
        assignContainer: function() {
            if (this.settings.container !== undefined) {
                this.container = this.columns.eq(0).closest(this.settings.container);
            } else {
                this.container = this.columns.eq(0).parents().has(this.columns.eq(1)).first();
            }

            return this.checkContainerValidity();
        },

        /**
         * Check that the assigned container is valid
         */
        checkContainerValidity: function() {
            var container = this.container;

            if (!container.length) {
                throw 'Unable to find container';
            }

            if (container.data('scrollableStickyColumns') !== undefined) {
                throw 'Cannot call this function more than once on the same container';
            }

            this.columns.each(function() {
                var column = $(this);

                if (!column.parents().filter(container).length) {
                    throw 'The container does not contain all the selected columns';
                }

                if (container.has(column.offsetParent()).length) {
                    throw 'The conatiner must be the offset parent of the columns';
                }
            });

            return true;
        },

        /**
         * Setup the plugin on the columns
         */
        init: function() {
            this.previousScrollTop = 0;
            this.busy = false;

            this.getDimensions();
            this.setupContainer();
            this.setupColumns();

            $(window).on('scroll', $.proxy(this.scrollHandler, this)).trigger('scroll');
            $(window).on('resize', $.proxy(this.resizeHandler, this));

            return this;
        },

        /**
         * Get a couple of importnat dimensions
         */
        getDimensions: function() {
            this.viewportHeight = $(window).height();
            this.documentHeight = $(document).height();
        },

        /**
         * Setup the container by making sure it has a position (so that it becomes the offset parent)
         * and set its height to its initial height. This means that it doesn't collapse when columns
         * in it start getting taken out of the document flow by being absolute or fixed positioned.
         */
        setupContainer: function() {
            var self = this;

            this.container.data('scrollableStickyColumns', new (function() {
                this.originalStyle = self.container.attr('style') || false;
                this.height = self.container.height();
                this.innerHeight = self.container.innerHeight();
                this.outerHeight = self.container.outerHeight();
                this.topOffset = self.container.offset().top + parseInt(self.container.css('border-top-width'), 10);
                this.bottomOffset = self.documentHeight - this.topOffset - self.container.outerHeight() + parseInt(self.container.css('margin-bottom'), 10);
            })());

            this.container.css({
                position: 'relative',
                height: (this.container.css('box-sizing') == 'border-box') ? this.container.data('scrollableStickyColumns').outerHeight : this.container.data('scrollableStickyColumns').height
            });
        },

        /**
         * Reduce the selected columns to the ones that are not the tallest, as these are the ones
         * that we will be acting on. Absolute position them where they are. Also set their width,
         * to avoid them going crazy when positioned.
         */
        setupColumns: function() {
            var tallestColumn = null,
                tallestColumnHeight = 0,
                self = this,
                scrollTop = $(document).scrollTop(),
                containerData = this.container.data('scrollableStickyColumns');

            this.columns.each(function() {
                var $this = $(this),
                    height = $this.outerHeight(),
                    offset = $this.offset(),
                    position = $this.position();

                $this.data('scrollableStickyColumns', new (function() {
                    this.originalStyle = $this.attr('style') || false;
                    this.height = height;
                    this.width = ($this.css('box-sizing') == 'border-box') ? $this.outerWidth() : $this.width();
                    this.marginTop = parseInt($this.css('margin-top'), 10);
                    this.marginRight = parseInt($this.css('margin-right'), 10);
                    this.marginBottom = parseInt($this.css('margin-bottom'), 10);
                    this.marginLeft = parseInt($this.css('margin-left'), 10);
                    this.topOffset = offset.top - this.marginTop;
                    this.leftOffset = offset.left - this.marginLeft;
                    this.topPosition = position.top;
                    this.leftPosition = position.left;
                    this.topStop = (self.settings.topStop !== undefined) ? self.settings.topStop : this.topPosition;
                    this.currentPosition = 'absolute';
                    this.upSet = true;
                    this.downSet = false;
                })());

                if ((tallestColumn === null) || (height > tallestColumnHeight)) {
                    tallestColumn = $this;
                    tallestColumnHeight = height;
                }
            });

            this.nonTallest = this.columns.not(tallestColumn);

            this.columns.each(function() {
                var $this = $(this),
                    columnData = $this.data('scrollableStickyColumns');

                $this.css({
                    position: 'absolute',
                    left: columnData.leftPosition,
                    width: columnData.width
                });

                columnData.bottomOffset = self.documentHeight - tallestColumn.data('scrollableStickyColumns').topOffset - tallestColumn.outerHeight();
                columnData.bottomStop = (self.settings.bottomStop !== undefined) ? self.settings.bottomStop : containerData.innerHeight - tallestColumnHeight - tallestColumn.data('scrollableStickyColumns').topPosition;

                // Handle columns that are shorter than the viewport constraint - they have their bottomStop increased
                // so that they do not scroll until their bottom hits the bottom of the container
                columnData.bottomStop += Math.max(0, self.viewportHeight - columnData.topStop - columnData.bottomStop - columnData.height);
            });

            // This checks if the column should already be scrolled down when the
            // plugin is initialised, and if so, moves it to where it should be
            this.nonTallest.each(function() {
                var $this = $(this),
                    columnData = $this.data('scrollableStickyColumns');

                if ((self.viewportHeight + scrollTop - columnData.bottomStop + columnData.marginTop) > (self.documentHeight - columnData.bottomOffset)) {
                    $this.css({
                        top: self.documentHeight - columnData.bottomOffset - containerData.topOffset - columnData.height
                    });
                }
            });
        },

        /**
         * On scroll, this function calculates where each column should be in
         * relation to the viewport and its container, and positions it as required
         */
        scrollHandler: function() {
            var self = this;

            // To avoid possible overlaps/races in the scroll events, we block them
            // from being able to occur simultaneously
            if (this.busy) {
                return;
            }

            this.busy = true;

            var scrollTop = $(document).scrollTop(),
                containerData = this.container.data('scrollableStickyColumns');

            // We only act on the non-tallest columns
            this.nonTallest.each(function() {
                var $this = $(this),
                    columnData = $this.data('scrollableStickyColumns'),
                    currentTopOffset = parseInt($this.offset().top, 10);

                if (scrollTop > self.previousScrollTop) { // Going down
                    if (((self.viewportHeight + scrollTop - columnData.bottomStop - columnData.marginTop) > (self.documentHeight - columnData.bottomOffset)) && (columnData.currentPosition == 'fixed')) {
                        // If (bottom of viewport - bottomStop) is below bottom of container, column has
                        // reached its bottom constraint and needs to be absolutely positioned so that
                        // its bottom is at the bottom of the container
                        $this.css({
                            position: 'absolute',
                            top: self.documentHeight - columnData.bottomOffset - containerData.topOffset - columnData.height,
                            left: columnData.leftPosition
                        });

                        columnData.currentPosition = 'absolute';
                        columnData.upSet = false;

                        $this.trigger('reachedBottomOfContainer.scrollableStickyColumns');
                    } else if (((currentTopOffset + columnData.height) < (self.viewportHeight + scrollTop - columnData.bottomStop) && ((self.documentHeight - columnData.bottomOffset + columnData.marginTop) > (self.viewportHeight + scrollTop - columnData.bottomStop))) && columnData.currentPosition != 'fixed') {
                        // If (bottom of viewport - bottomStop) is below current bottom of column and above bottom of container
                        $this.css({
                            position: 'fixed',
                            top: self.viewportHeight - columnData.height - columnData.bottomStop - columnData.marginTop,
                            left: columnData.leftOffset
                        });

                        columnData.currentPosition = 'fixed';
                        columnData.upSet = false;

                        $this.trigger('stuckToBottom.scrollableStickyColumns');
                    } else if (!columnData.downSet) {
                        // If we're not at the bottom and we haven't already set it, we've started moving down
                        $this.css({
                            position: 'absolute',
                            top: currentTopOffset - containerData.topOffset - columnData.marginTop,
                            left: columnData.leftPosition
                        });

                        columnData.currentPosition = 'absolute';
                        columnData.downSet = true;

                        $this.trigger('unstuckFromTop.scrollableStickyColumns');
                    }
                } else if (scrollTop < self.previousScrollTop) { // Going up
                    if (!columnData.upSet) {
                        // If we're not at the top and we haven't already set it, we've started moving up
                        $this.css({
                            position: 'absolute',
                            top: currentTopOffset - containerData.topOffset - columnData.marginTop,
                            left: columnData.leftPosition
                        });

                        columnData.currentPosition = 'absolute';
                        columnData.upSet = true;

                        $this.trigger('unstuckFromBottom.scrollableStickyColumns');
                    } else if ((columnData.topOffset < (scrollTop + columnData.topStop - columnData.marginTop) && (currentTopOffset > (scrollTop + columnData.topStop))) && (columnData.currentPosition != 'fixed')) {
                        // If top of column is below starting position and above top of viewport
                        $this.css({
                            position: 'fixed',
                            top: columnData.topStop - columnData.marginTop,
                            left: columnData.leftOffset
                        });

                        columnData.currentPosition = 'fixed';
                        columnData.downSet = false;

                        $this.trigger('stuckToTop.scrollableStickyColumns');
                    } else if (((scrollTop + columnData.topStop - columnData.marginTop) < columnData.topOffset) && (columnData.currentPosition == 'fixed')) {
                        // If top of column is below starting position
                        $this.css({
                            position: 'absolute',
                            top: columnData.topOffset - containerData.topOffset,
                            left: columnData.leftPosition
                        });

                        columnData.currentPosition = 'absolute';
                        columnData.downSet = false;

                        $this.trigger('reachedTopOfContainer.scrollableStickyColumns');
                    }
                }
            });

            this.previousScrollTop = scrollTop;

            this.busy = false;
        },

        /**
         * On resize, this function removes the plugin from the elements it works
         * on and reinitialises it. This is the most consistent way to do this.
         */
        resizeHandler: function() {
            this.remove().init();
        },

        /**
         * Removes the plugin from all elements it works on by resetting their
         * inline style property to what it was before the plugin was initialised
         */
        remove: function() {
            $(window).off('scroll', this.scrollHandler);
            $(window).off('resize', this.resizeHandler);

            this.container.attr('style', this.container.data('scrollableStickyColumns').originalStyle);

            this.columns.each(function() {
                var $this = $(this);

                $this.attr('style', $this.data('scrollableStickyColumns').originalStyle);
            });

            return this;
        }
    }

    /**
     * Attach the plugin
     */
    $.fn.scrollableStickyColumns = function(options) {
        return new ScrollableStickyColumns(this, options);
    }
})(jQuery, window, document);
