define(
	'spell/shared/util/scene/Scene',
	[
		'spell/shared/util/create',
		'spell/shared/util/createId',
		'spell/shared/util/createModuleId',
		'spell/shared/util/entityConfig/flatten',
		'spell/shared/util/hashModuleId',
		'spell/shared/util/Events',
		'spell/shared/util/OrderedMap',
		'spell/shared/util/platform/PlatformKit',

		'spell/functions'
	],
	function(
		create,
		createId,
		createModuleId,
		flattenEntityConfig,
		hashModuleId,
		Events,
		OrderedMap,
		PlatformKit,

		_
	) {
		'use strict'


		/*
		 * private
		 */

		var cameraEntityTemplateId    = 'spell.entity.2d.graphics.camera',
			cameraComponentTemplateId = 'spell.component.2d.graphics.camera'

		var loadModule = function( moduleId, anonymizeModuleIds ) {
			if( !moduleId ) throw 'Error: No module id provided.'

			var module = PlatformKit.ModuleLoader.require(
				moduleId,
				undefined,
				{
					loadingAllowed : !anonymizeModuleIds
				}
			)

			if( !module ) throw 'Error: Could not resolve module id \'' + moduleId + '\' to module.'

			return module
		}

		/*
		 * TODO: Remove this custom invoke that knows how to handle the borked instances produced by the "create" constructor wrapper function.
		 * Instances created by "create" for some unknown reason do not support prototype chain method look-up. See "Fix create"
		 */
		var invoke = function( orderedMap, functionName, args ) {
			var systems = orderedMap.values

			for( var i = 0, numSystems = systems.length; i < numSystems; i++ ) {
				var system = systems[ i ]

				system.prototype[ functionName ].apply( system, args )
			}
		}

		var createTemplateId = function( namespace, name ) {
			return namespace + '.' + name
		}

		var createSystem = function( spell, entityManager, system, anonymizeModuleIds, systemConfig ) {
			var moduleId = createModuleId( createId( system.namespace, system.name ) )

			var constructor = loadModule(
				anonymizeModuleIds ? hashModuleId( moduleId ) : moduleId,
				anonymizeModuleIds
			)

			var componentsInput = _.reduce(
				system.input,
				function( memo, inputDefinition ) {
					var componentDictionary = entityManager.getComponentDictionaryById( inputDefinition.componentId )

					if( !componentDictionary ) {
						throw 'Error: No component list for component template id \'' + inputDefinition.componentId +  '\' available.'
					}

					memo[ inputDefinition.name ] = componentDictionary

					return memo
				},
				{}
			)

			// TODO: Fix create. Returned instances do not support prototype chain method look-up. O_o
			return create( constructor, [ spell ], componentsInput )
		}

		var createSystems = function( spell, entityManager, templateManager, systemIds, anonymizeModuleIds ) {
			return _.reduce(
				systemIds,
				function( memo, systemId ) {
					return memo.add(
						systemId,
						createSystem( spell, entityManager, templateManager.getTemplate( systemId ), anonymizeModuleIds )
					)
				},
				new OrderedMap()
			)
		}

		var hasActiveCamera = function( sceneConfig ) {
			return _.any(
				flattenEntityConfig( sceneConfig.entities ),
				function( entityConfig ) {
					if( entityConfig.entityTemplateId !== cameraEntityTemplateId ||
						!entityConfig.config ) {

						return false
					}

					var cameraComponent = entityConfig.config[ cameraComponentTemplateId ]

					if( !cameraComponent ) return false

					return cameraComponent.active
				}
			)
		}


		/*
		 * public
		 */

		var Scene = function( spell, entityManager, templateManager, anonymizeModuleIds ) {
			this.spell              = spell
			this.entityManager      = entityManager
			this.templateManager    = templateManager
			this.anonymizeModuleIds = anonymizeModuleIds
			this.executionGroups    = { render : null, update : null }
			this.script             = null
		}

		Scene.prototype = {
			render: function( timeInMs, deltaTimeInMs ) {
				invoke( this.executionGroups.render, 'process', [ this.spell, timeInMs, deltaTimeInMs ] )
			},
			update: function( timeInMs, deltaTimeInMs ) {
				invoke( this.executionGroups.update, 'process', [ this.spell, timeInMs, deltaTimeInMs ] )
			},
			init: function( sceneConfig ) {
				if( !hasActiveCamera( sceneConfig ) ) {
					this.spell.logger.error( 'Could not start scene "' + sceneConfig.name + '" because no camera entity was found. A scene must have at least one active camera entity.' )

					return
				}

				var anonymizeModuleIds = this.anonymizeModuleIds

				if( sceneConfig.systems ) {
					var spell           = this.spell,
						entityManager   = this.entityManager,
						templateManager = this.templateManager,
						executionGroups = this.executionGroups

					executionGroups.render = createSystems( spell, entityManager, templateManager, sceneConfig.systems.render, anonymizeModuleIds )
					executionGroups.update = createSystems( spell, entityManager, templateManager, sceneConfig.systems.update, anonymizeModuleIds )

					invoke( executionGroups.render, 'init', [ spell, sceneConfig ] )
					invoke( executionGroups.update, 'init', [ spell, sceneConfig ] )

					invoke( executionGroups.render, 'activate', [ spell, sceneConfig ] )
					invoke( executionGroups.update, 'activate', [ spell, sceneConfig ] )
				}

				var moduleId = createModuleId( createId( sceneConfig.namespace, sceneConfig.name ) )

				this.script = loadModule(
					anonymizeModuleIds ? hashModuleId( moduleId ) : moduleId,
					anonymizeModuleIds
				)

				this.script.init( this.spell, sceneConfig )
			},
			destroy: function( sceneConfig ) {
				var executionGroups = this.executionGroups

				invoke( executionGroups.render, 'deactivate', [ this.spell, sceneConfig ] )
				invoke( executionGroups.update, 'deactivate', [ this.spell, sceneConfig ] )

				invoke( executionGroups.render, 'destroy', [ this.spell, sceneConfig ] )
				invoke( executionGroups.update, 'destroy', [ this.spell, sceneConfig ] )

				this.script.destroy( this.spell, sceneConfig )
			},
			restartSystem: function( systemId, executionGroupId, systemConfig ) {
				var executionGroup = this.executionGroups[ executionGroupId ]
				if( !executionGroup ) return

				var system = executionGroup.getByKey( systemId )
				if( !system ) return

				// deactivating, destroying ye olde system
				var spell  = this.spell

				system.prototype.deactivate( spell )
				system.prototype.destroy( spell )

				// initializing and activating the new system instance
				var newSystem = createSystem(
					spell,
					this.entityManager,
					this.templateManager.getTemplate( systemId ),
					this.anonymizeModuleIds,
					systemConfig
				)

				newSystem.prototype.init( spell )
				newSystem.prototype.activate( spell )

				executionGroup.add( systemId, newSystem )
			},
			addSystem: function( systemId, executionGroupId, index, systemConfig ) {
				var executionGroup = this.executionGroups[ executionGroupId ]
				if( !executionGroup ) return

				executionGroup.insert(
					systemId,
					createSystem(
						spell,
						this.entityManager,
						this.templateManager.getTemplate( systemId ),
						this.anonymizeModuleIds,
						systemConfig
					),
					index
				)
			},
			removeSystem: function( systemId, executionGroupId ) {
				var executionGroup = this.executionGroups[ executionGroupId ]
				if( !executionGroup ) return

				executionGroup.removeByKey( systemId )
			},
			moveSystem: function( systemId, srcExecutionGroupId, dstExecutionGroupId, dstIndex ) {
				var srcExecutionGroup = this.executionGroups[ srcExecutionGroupId ],
					dstExecutionGroup = this.executionGroups[ dstExecutionGroupId ]

				if( !srcExecutionGroup || !dstExecutionGroup ) return

				var system = srcExecutionGroup.getByKey( systemId )
				if( !system ) return

				dstExecutionGroup.insert( systemId, system, dstIndex )
				srcExecutionGroup.removeByKey( systemId )
			}
		}

		return Scene
	}
)
