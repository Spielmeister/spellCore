define(
	'spell/Defines',
	function() {
		'use strict'


		return {
			ROOT_COMPONENT_ID                         : 'spell.component.entityComposite.root',
			PARENT_COMPONENT_ID                       : 'spell.component.entityComposite.parent',
			CHILDREN_COMPONENT_ID                     : 'spell.component.entityComposite.children',
			NAME_COMPONENT_ID                         : 'spell.component.name',
			EVENT_HANDLERS_COMPONENT_ID               : 'spell.component.eventHandlers',
			TRANSFORM_COMPONENT_ID                    : 'spell.component.2d.transform',
			APPEARANCE_TRANSFORM_COMPONENT_ID         : 'spell.component.2d.graphics.appearanceTransform',
			CAMERA_COMPONENT_ID                       : 'spell.component.2d.graphics.camera',
			STATIC_APPEARANCE_COMPONENT_ID            : 'spell.component.2d.graphics.appearance',
			ANIMATED_APPEARANCE_COMPONENT_ID          : 'spell.component.2d.graphics.animatedAppearance',
			QUAD_GEOMETRY_COMPONENT_ID                : 'spell.component.2d.graphics.geometry.quad',
			TILEMAP_COMPONENT_ID                      : 'spell.component.2d.graphics.tilemap',
			PHYSICS_BODY_COMPONENT_ID                 : 'spell.component.physics.body',
			PHYSICS_FIXTURE_COMPONENT_ID              : 'spell.component.physics.fixture',
			PHYSICS_BOX_SHAPE_COMPONENT_ID            : 'spell.component.physics.shape.box',
			PHYSICS_CIRCLE_SHAPE_COMPONENT_ID         : 'spell.component.physics.shape.circle',
			PHYSICS_CONVEX_POLYGON_SHAPE_COMPONENT_ID : 'spell.component.physics.shape.convexPolygon',
			PHYSICS_JNRPLAYER_SHAPE_COMPONENT_ID      : 'spell.component.physics.shape.jumpAndRunPlayer'
		}
	}
)
