define(
	"spell/shared/util/platform/private/Input",
	[
		"spell/shared/util/input/keyCodes",
		"spell/math/util",

		'spell/functions'
	],
	function(
		keyCodes,
		mathUtil,

		_
	) {
		"use strict"


		/*
		 * private
		 */

		var preventDefault = function( event ) {
			if( event.preventDefault ) {
				event.preventDefault()

			} else if ( event.stopPropagation ) {
				e.stopPropagation()
			} else {
				event.returnValue = false
			}
		}

		/*
		 * Thanks to John Resig. http://ejohn.org/blog/flexible-javascript-events/
		 *
		 * @param obj
		 * @param type
		 * @param fn
		 */
		var addEvent = function( obj, type, fn ) {
		  if ( obj.attachEvent ) {
		    obj['e'+type+fn] = fn;
		    obj[type+fn] = function(){obj['e'+type+fn]( window.event );}
		    obj.attachEvent( 'on'+type, obj[type+fn] );
		  } else if ( obj.addEventListener ) {
            obj.addEventListener( type, fn, false );
          }
		}

		var isEventSupported = function( eventName ) {
			return _.has( nativeEventMap, eventName )
		}

		function getOffset( element ) {
			var box = element.getBoundingClientRect()

			var body    = document.body
			var docElem = document.documentElement

			var scrollTop  = window.pageYOffset || docElem.scrollTop || body.scrollTop
			var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft

			var clientTop  = docElem.clientTop || body.clientTop || 0
			var clientLeft = docElem.clientLeft || body.clientLeft || 0

			var top  = box.top + scrollTop - clientTop
			var left = box.left + scrollLeft - clientLeft

			return [ Math.round( left ), Math.round( top ) ]
		}

		var nativeTouchHandler = function( callback, event ) {
			preventDefault( event )

			var touch = event.changedTouches[ 0 ]
			var offset = getOffset( this.container )
			var screenSize = this.configurationManager.currentScreenSize

			var position = [
				( touch.pageX - offset[ 0 ] ) / screenSize[ 0 ],
				( touch.pageY - offset[ 1 ] ) / screenSize[ 1 ]
			]

			// if the event missed the display it gets ignored
			if( !mathUtil.isInInterval( position[ 0 ], 0.0, 1.0 ) ||
				!mathUtil.isInInterval( position[ 1 ], 0.0, 1.0 ) ) {

				return
			}

			callback( {
				type     : event.type,
				position : position
			} )
		}

		var nativeKeyHandler = function( callback, event ) {
			preventDefault( event )
			callback( event )
		}

		var nativeMouseWheelHandler = function( callback, event ) {
			var delta = event.wheelDelta ? event.wheelDelta : (event.detail * -1)

			var direction = delta > 0 ? 1 : -1
			preventDefault( event )

			callback( {
				type:       'mousewheel',
				direction:  direction
			})
		}

        var nativeMouseClickHandler = function( callback, event ) {
			var offset = getOffset( this.container )
			var screenSize = this.configurationManager.currentScreenSize

			var position = [
				( event.pageX - offset[ 0 ] ) / screenSize[ 0 ],
				( event.pageY - offset[ 1 ] ) / screenSize[ 1 ]
			]

            // if the event missed the display it gets ignored
            if( !mathUtil.isInInterval( position[ 0 ], 0.0, 1.0 ) ||
                !mathUtil.isInInterval( position[ 1 ], 0.0, 1.0 ) ) {

                return
            }

            callback( {
                type     : event.type,      //mousedown, mouseup
	            button   : event.button,    //0=left button, 1=middle button if present, 2=right button
                position : position
            } )
        }

		var nativeMouseMoveHandler = function( callback, event ) {
			var offset = getOffset( this.container )
			var screenSize = this.configurationManager.currentScreenSize

			var position = [
				( event.pageX - offset[ 0 ] ) / screenSize[ 0 ],
				( event.pageY - offset[ 1 ] ) / screenSize[ 1 ]
			]

			// if the event missed the display it gets ignored
			if( !mathUtil.isInInterval( position[ 0 ], 0.0, 1.0 ) ||
				!mathUtil.isInInterval( position[ 1 ], 0.0, 1.0 ) ) {

				return
			}

			callback( {
				type     : event.type, //mousemove
				position : position
			} )
		}

		var nativeContextMenuHandler = function( callback, event ) {
			//prevent the default context menu in the browser
			preventDefault( event )
		}

		/*
		 * maps the internal event name to to native event name and callback
		 */
		var nativeEventMap = {
            touchstart : {
	            'touchstart'      : nativeTouchHandler
            },
            touchend : {
	            'touchend'        : nativeTouchHandler
            },
			mousedown : {
				'mousedown'       : nativeMouseClickHandler,
				'contextmenu'     : nativeContextMenuHandler
			},
			mouseup : {
				'mouseup'         : nativeMouseClickHandler
			},
			mousemove : {
				'mousemove'       : nativeMouseMoveHandler
			},
			mousewheel : {
				'mousewheel'      : nativeMouseWheelHandler,
				'DOMMouseScroll'  : nativeMouseWheelHandler
			},
			keydown : {
				'keydown'         : nativeKeyHandler
			},
			keyup : {
				'keyup'           : nativeKeyHandler
			}
		}


		/*
		 * public
		 */

		var Input = function( configurationManager ) {
			this.configurationManager = configurationManager
			this.container = document.getElementById( configurationManager.id )
		}

		var setListener = function( eventName, callback ) {
			if( !isEventSupported( eventName ) ) return

			var me              = this,
				nativeEvents    = nativeEventMap[ eventName ]

			_.each( nativeEvents, function( nativeEventHandler, nativeEventName ) {
				addEvent( document.body, nativeEventName,  _.bind( nativeEventHandler, me, callback ) )
			})
		}

		var removeListener = function( eventName ) {
			if( !isEventSupported( eventName ) ) return

			var nativeEvent = nativeEventMap[ eventName ]

			for (var i = 0; i < nativeEvent.eventNames; i++ ) {
				this.container[ 'on' + nativeEvent.eventNames[ i ] ] = null
			}
		}

		Input.prototype = {
			setInputEventListener    : setListener,
			removeInputEventListener : removeListener
		}

		return Input
	}
)
