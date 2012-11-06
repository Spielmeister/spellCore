/**
 * The InputManager contains functions for processing user input
 *
 * @class spell.inputManager
 * @singleton
 */
define(
	"spell/InputManager",
	[
		"spell/shared/util/platform/PlatformKit"
	],
	function(
		PlatformKit
	) {
		"use strict"

		//TODO: get constants from a global configuration
		var constants = {
			"xSize" : 1024,
			"ySize" : 768
		}

		/*
		 * private
		 */

		var nextSequenceNumber = 0

		/*
		 * public
		 */
		var inputEvents = []

		var mouseClickHandler = function( event ) {
			// scale screen space position to "world" position
			event.position[ 0 ] *= constants.xSize
			event.position[ 1 ] *= constants.ySize

			var internalEvent = {
				type           : event.type,
				sequenceNumber : nextSequenceNumber++,
                position       : event.position
			}

			inputEvents.push( internalEvent )
		}

		var mouseMoveHandler = function( event ) {

		}

		var mouseWheelHandler = function( event ) {

			var internalEvent = {
				type           : event.type,
				sequenceNumber : nextSequenceNumber++,
				direction      : event.direction
			}

			inputEvents.push( internalEvent )
		}

        var touchHandler = function( event ) {
            // scale screen space position to "world" position
            event.position[ 0 ] *= constants.xSize
            event.position[ 1 ] *= constants.ySize

            var internalEvent = {
                type           : ( event.type === 'touchstart' ? 'mousedown' : 'mouseup' ),
                sequenceNumber : nextSequenceNumber++,
                position       : event.position
            }

            inputEvents.push( internalEvent )
        }

		var keyHandler = function( event ) {
			inputEvents.push( createKeyEvent( event.type, event.keyCode ) )
		}

		var createKeyEvent = function( type, keyCode ) {
			return {
				type           : type,
				keyCode        : keyCode,
				sequenceNumber : nextSequenceNumber++
			}
		}


		var InputManager = function( configurationManager ) {
			this.nativeInput = PlatformKit.createInput( configurationManager )
		}

		InputManager.prototype = {
			/**
			 * Initialize the InputManager. This function is being called by spellCore, don't call it yourself!
			 * @private
			 */
			init : function() {
				if( PlatformKit.features.touch ) {
					this.nativeInput.setInputEventListener( 'touchstart', touchHandler )
					this.nativeInput.setInputEventListener( 'touchend', touchHandler )
				}

                this.nativeInput.setInputEventListener( 'mousedown', mouseClickHandler )
                this.nativeInput.setInputEventListener( 'mouseup', mouseClickHandler )
				this.nativeInput.setInputEventListener( 'mousewheel', mouseWheelHandler );

				this.nativeInput.setInputEventListener( 'keydown', keyHandler )
				this.nativeInput.setInputEventListener( 'keyup', keyHandler )
			},
			/**
			 * Destroys the InputManager. This function is being called by spellCore, don't call it yourself!
			 * @private
			 */
			destroy : function() {
				if( PlatformKit.features.touch ) {
					this.nativeInput.removeInputEventListener( 'touchstart' )
					this.nativeInput.removeInputEventListener( 'touchend' )
				}

                this.nativeInput.removeInputEventListener( 'mousedown' )
                this.nativeInput.removeInputEventListener( 'mouseup' )
				this.nativeInput.removeInputEventListener( 'mousewheel' )

				this.nativeInput.removeInputEventListener( 'keydown' )
				this.nativeInput.removeInputEventListener( 'keyup' )
			},
			getInputEvents : function() {
				return inputEvents
			},
			/**
			 * Clear the current input event queue.
			 */
			clearInputEvents : function() {
				inputEvents.length = 0

			},
			injectKeyEvent : function( type, keyCode ) {
				inputEvents.push( createKeyEvent( type, keyCode ) )
			}
		}

		return InputManager
	}
)
