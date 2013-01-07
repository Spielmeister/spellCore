define(
	'spell/StatisticsManager',
	[
		'spell/shared/util/data/Tree'
	],
	function(
		Tree
	) {
		'use strict'


		var NUM_VALUES   = 63,
			FLOAT_DIGITS = 1

		var addNode = Tree.addNode,
			getNode = Tree.getNode,
			eachNode = Tree.eachNode

		var createBuffer = function( bufferSize ) {
			var buffer = []

			while( bufferSize > 0 ) {
				buffer.push( 0 )
				bufferSize--
			}

			return buffer
		}

		/**
		 * Computes the "standard deviation of the sample".
		 * See http://en.wikipedia.org/wiki/Standard_deviation#Standard_deviation_of_the_sample
		 *
		 * @param expected
		 * @param values
		 */
		var createStandardDeviation = function( expected, values ) {
			var numValues = values.length,
				sum = 0

			for( var i = 0; i < numValues; i++ ) {
				sum += Math.pow( values[ i ] - expected, 2 )
			}

			return Math.sqrt( sum / numValues )
		}

		var createNode = function( id ) {
			return {
				children : [],
				id : id,
				metrics : [ 0, 0, 0, 0 ],
				values : createBuffer( NUM_VALUES )
			}
		}

		var updateNodeMetrics = function( node ) {
			var values = node.values,
				mean = 0,
				min = Number.MAX_VALUE,
				max = 0,
				sum = 0

			for( var i = 0, numValues = values.length; i < numValues; i++ ) {
				var value = values[ i ]

				if( value === 0 ) continue

				if( value < min ) min = value
				if( value > max ) max = value

				sum += value
			}

			if( sum !== 0 ) {
				mean = sum / NUM_VALUES

			} else {
				min = 0
			}

			var metrics = node.metrics

			metrics[ 0 ] = mean.toFixed( FLOAT_DIGITS )
			metrics[ 1 ] = min.toFixed( FLOAT_DIGITS )
			metrics[ 2 ] = max.toFixed( FLOAT_DIGITS )
			metrics[ 3 ] = createStandardDeviation( mean, values ).toFixed( 2 )
		}

		var createNumValuesInPeriod = function( timestamps, periodInMs ) {
			if( !periodInMs ) periodInMs = 0

			var numTimestamps = timestamps.length,
				earliest      = timestamps[ numTimestamps - 1 ] - periodInMs

			for( var i = timestamps.length - 1; i >= 0; i-- ) {
				var current = timestamps[ i ]

				if( current <= earliest ) {
					return numTimestamps - i
				}
			}

			return numTimestamps
		}


		var StatisticsManager = function() {
			this.tree = null
			this.timestamps = createBuffer( NUM_VALUES )
		}

		StatisticsManager.prototype = {
			init : function() {
				this.tree = createNode( 'total' )

				addNode( this.tree, 'total', createNode( 'render' ) )
				addNode( this.tree, 'total', createNode( 'update' ) )
			},
			addNode : function( id, parentId ) {
				var success = addNode( this.tree, parentId, createNode( id ) )

				if( !success ) {
					throw 'Could not add node "' + id + '" to parent node "' + parentId + '".'
				}
			},
			/*
			 * call this method to signal the beginning of a new measurement period
			 */
			startTick : function( timestamp ) {
				var timestamps = this.timestamps

				timestamps.shift()
				timestamps.push( timestamp )

				eachNode(
					this.tree,
					function( node ) {
						var values = node.values

						values.shift()
						values.push( 0 )
					}
				)
			},
			updateNode : function( id, value ) {
				var node = getNode( this.tree, id )
				if( !node ) return

				node.values[ node.values.length - 1 ] += value
			},
			getMetrics : function( periodInMs ) {
				eachNode( this.tree, updateNodeMetrics )

				return this.tree
			}
		}

		return StatisticsManager
	}
)
