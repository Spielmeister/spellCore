define(
	'spell/system/physics',
	[
		'spell/Defines',
		'spell/Events',
		'spell/shared/util/platform/PlatformKit',

		'spell/functions'
	],
	function(
		Defines,
		Events,
		PlatformKit,

		_
	) {
		'use strict'


		var Box2D                   = PlatformKit.Box2D,
			createB2Vec2            = Box2D.Common.Math.createB2Vec2,
			createB2FixtureDef      = Box2D.Dynamics.createB2FixtureDef,
			createB2ContactListener = Box2D.Dynamics.createB2ContactListener,
			createB2PolygonShape    = Box2D.Collision.Shapes.createB2PolygonShape,
			createB2CircleShape     = Box2D.Collision.Shapes.createB2CircleShape

		var awakeColor    = [ 0.82, 0.76, 0.07 ],
			notAwakeColor = [ 0.27, 0.25, 0.02 ]

		var entityEventBeginContact = function( entityManager, contactTriggers, eventId, contact, manifold ) {
			var entityIdA = contact.GetFixtureA().GetUserData(),
				entityIdB = contact.GetFixtureB().GetUserData(),
				contactTrigger

			if( entityIdA ) {
				entityManager.triggerEvent( entityIdA, eventId, [ entityIdB, contact, manifold ] )

				contactTrigger = contactTriggers[ entityIdA ]

				if( contactTrigger && entityIdB ) {
					entityManager.triggerEvent( entityIdB, contactTrigger.eventId, [ entityIdA ].concat( contactTrigger.parameters ) )
				}
			}

			if( entityIdB ) {
				entityManager.triggerEvent( entityIdB, eventId, [ entityIdA, contact, manifold ] )

				contactTrigger = contactTriggers[ entityIdB ]

				if( contactTrigger && entityIdA ) {
					entityManager.triggerEvent( entityIdA, contactTrigger.eventId, [ entityIdB ].concat( contactTrigger.parameters ) )
				}
			}
		}

		var entityEventEndContact = function( entityManager, eventId, contact, manifold ) {
			var entityIdA = contact.GetFixtureA().GetUserData(),
				entityIdB = contact.GetFixtureB().GetUserData()
			if( entityIdA ) {
				entityManager.triggerEvent( entityIdA, eventId, [ entityIdB, contact, manifold ] )
			}

			if( entityIdB ) {
				entityManager.triggerEvent( entityIdB, eventId, [ entityIdA, contact, manifold ] )
			}
		}

		var createContactListener = function( entityManager, contactTriggers ) {
			return createB2ContactListener(
				function( contact, manifold ) {
					entityEventBeginContact( entityManager, contactTriggers, 'beginContact', contact, manifold )
				},
				function( contact, manifold ) {
					entityEventEndContact( entityManager, 'endContact', contact, manifold )
				},
				null,
				null
			)
		}

		var createBody = function( spell, debug, world, entityId, entity ) {
			var body               = entity[ Defines.PHYSICS_BODY_COMPONENT_ID ],
				fixture            = entity[ Defines.PHYSICS_FIXTURE_COMPONENT_ID ],
				boxShape           = entity[ Defines.PHYSICS_BOX_SHAPE_COMPONENT_ID ],
				circleShape        = entity[ Defines.PHYSICS_CIRCLE_SHAPE_COMPONENT_ID ],
				convexPolygonShape = entity[ Defines.PHYSICS_CONVEX_POLYGON_SHAPE_COMPONENT_ID ],
				transform          = entity[ Defines.TRANSFORM_COMPONENT_ID ]

			if( !body || !fixture || !transform ||
				( !boxShape && !circleShape && !convexPolygonShape ) ) {

				return
			}

			createPhysicsObject( world, entityId, body, fixture, boxShape, circleShape, convexPolygonShape, transform )

			if( debug ) {
				var componentId,
					config

				if( circleShape ) {
					componentId = 'spell.component.2d.graphics.debug.circle'
					config = {
						radius : circleShape.radius
					}

				} else if( convexPolygonShape ) {
					var minX = _.reduce( convexPolygonShape.vertices, function( memo, v ) { var x = v[ 0 ]; return memo < x ? memo : x }, 0 ),
						maxX = _.reduce( convexPolygonShape.vertices, function( memo, v ) { var x = v[ 0 ]; return memo > x ? memo : x }, 0 ),
						minY = _.reduce( convexPolygonShape.vertices, function( memo, v ) { var y = v[ 1 ]; return memo < y ? memo : y }, 0 ),
						maxY = _.reduce( convexPolygonShape.vertices, function( memo, v ) { var y = v[ 1 ]; return memo > y ? memo : y }, 0 )

					componentId = 'spell.component.2d.graphics.debug.box'
					config = {
						width : maxX - minX,
						height : maxY - minY
					}

				} else {
					var boxesqueShape = boxShape

					componentId = 'spell.component.2d.graphics.debug.box'
					config = {
						width : boxesqueShape.dimensions[ 0 ],
						height : boxesqueShape.dimensions[ 1 ]
					}
				}

				spell.entityManager.addComponent(
					entityId,
					componentId,
					config
				)
			}
		}

		var destroyBodies = function( world, destroyedEntities ) {
			for( var i = 0, numDestroyedEntities = destroyedEntities.length; i < numDestroyedEntities; i++ ) {
				var body = world.getBodyById( destroyedEntities[ i ] )

				if( !body ) continue

				world.DestroyBody( body )
			}
		}

		var addShape = function( world, worldToPhysicsScale, entityId, bodyDef, fixture, boxShape, circleShape, convexPolygonShape ) {
			var fixtureDef = createB2FixtureDef()

			fixtureDef.density     = fixture.density
			fixtureDef.friction    = fixture.friction
			fixtureDef.restitution = fixture.restitution
			fixtureDef.isSensor    = fixture.isSensor
			fixtureDef.userData    = entityId

			fixtureDef.filter.categoryBits = fixture.categoryBits
			fixtureDef.filter.maskBits     = fixture.maskBits

			if( boxShape ) {
				fixtureDef.shape = createB2PolygonShape()
				fixtureDef.shape.SetAsBox(
					boxShape.dimensions[ 0 ] / 2 * worldToPhysicsScale,
					boxShape.dimensions[ 1 ] / 2 * worldToPhysicsScale
				)

				bodyDef.CreateFixture( fixtureDef )

			} else if( circleShape ) {
				fixtureDef.shape = createB2CircleShape( circleShape.radius * worldToPhysicsScale )

				bodyDef.CreateFixture( fixtureDef )

			} else if( convexPolygonShape ) {
				var vertices = convexPolygonShape.vertices

				fixtureDef.shape = createB2PolygonShape()
				fixtureDef.shape.SetAsArray(
					_.map(
						vertices,
						function( x ) { return createB2Vec2( x[ 0 ] * worldToPhysicsScale, x[ 1 ] * worldToPhysicsScale ) }
					),
					vertices.length
				)

				bodyDef.CreateFixture( fixtureDef )
			}
		}

		var createPhysicsObject = function( world, entityId, body, fixture, boxShape, circleShape, convexPolygonShape, transform ) {
			var bodyDef = world.createBodyDef( entityId, body, transform )

			if( !bodyDef ) return

			addShape( world, world.scale, entityId, bodyDef, fixture, boxShape, circleShape, convexPolygonShape )
		}

		var step = function( rawWorld, deltaTimeInMs ) {
			rawWorld.Step( deltaTimeInMs / 1000, 10, 8 )
			rawWorld.ClearForces()
		}

		var transferState = function( world, worldToPhysicsScale, bodies, transforms ) {
			for( var body = world.GetBodyList(); body; body = body.GetNext() ) {
				var id = body.GetUserData()

				if( !id ) continue

				var position  = body.GetPosition(),
					transform = transforms[ id ]

				transform.translation[ 0 ] = position.x / worldToPhysicsScale
				transform.translation[ 1 ] = position.y / worldToPhysicsScale
				transform.rotation = body.GetAngle() * -1

				var velocityVec2  = body.GetLinearVelocity(),
					bodyComponent = bodies[ id ]

				bodyComponent.velocity[ 0 ] = velocityVec2.x / worldToPhysicsScale
				bodyComponent.velocity[ 1 ] = velocityVec2.y / worldToPhysicsScale
			}
		}

		var updateDebug = function( world, debugBoxes, debugCircles ) {
			for( var body = world.GetBodyList(); body; body = body.GetNext() ) {
				var id = body.GetUserData()

				if( !id ) continue

				var debugShape = debugBoxes[ id ] || debugCircles[ id ]

				debugShape.color = body.IsAwake() ? awakeColor : notAwakeColor
			}
		}

		var init = function( spell ) {
			this.world = spell.box2dWorlds.main

			if( !this.world ) {
				var doSleep = true,
					world   = spell.box2dContext.createWorld( doSleep, this.config.gravity, this.config.scale )

				world.getRawWorld().SetContactListener(
					createContactListener( spell.entityManager, this.contactTriggers )
				)

				this.world = world
				spell.box2dWorlds.main = world
			}
		}

		var activate = function( spell ) {
			this.entityCreatedHandler = _.bind( createBody, null, spell, this.debug, this.world )
			this.entityDestroyHandler = _.bind( this.removedEntitiesQueue.push, this.removedEntitiesQueue )

			spell.eventManager.subscribe( Events.ENTITY_CREATED, this.entityCreatedHandler )
			spell.eventManager.subscribe( Events.ENTITY_DESTROYED, this.entityDestroyHandler )
		}

		var deactivate = function( spell ) {
			spell.eventManager.unsubscribe( Events.ENTITY_CREATED, this.entityCreatedHandler )
			spell.eventManager.unsubscribe( Events.ENTITY_DESTROYED, this.entityDestroyHandler )
		}

		var process = function( spell, timeInMs, deltaTimeInMs ) {
			var world                = this.world,
				rawWorld             = this.world.getRawWorld(),
				transforms           = this.transforms,
				removedEntitiesQueue = this.removedEntitiesQueue

			if( removedEntitiesQueue.length ) {
				destroyBodies( world, removedEntitiesQueue )
				removedEntitiesQueue.length = 0
			}

			step( rawWorld, deltaTimeInMs )

			transferState( rawWorld, world.scale, this.bodies, transforms )

			if( this.debug ) {
				updateDebug( rawWorld, this.debugBoxes, this.debugCircles )
			}
		}

		var Physics = function( spell ) {
			this.debug = !!spell.configurationManager.debug
			this.entityCreatedHandler
			this.entityDestroyHandler
			this.world
			this.removedEntitiesQueue = []
		}

		Physics.prototype = {
			init : init,
			destroy : function() {},
			activate : activate,
			deactivate : deactivate,
			process : process
		}

		return Physics
	}
)
