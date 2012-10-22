define(
	'spell/shared/util/development/updateAsset',
	[
		'spell/client/loading/addNamespaceAndName',
		'spell/client/loading/createFilesToLoad',
		'spell/client/loading/injectResource',
		'spell/client/util/updateAssets',
		'spell/shared/util/createAssetId',
		'spell/shared/util/createId',
		'spell/shared/util/createLibraryFilePath',
		'spell/shared/util/createLibraryFilePathFromId',

		'spell/functions'
	],
	function(
		addNamespaceAndName,
		createFilesToLoad,
		injectResource,
		updateAssets,
		createAssetId,
		createId,
		createLibraryFilePath,
		createLibraryFilePathFromId,

		_
	) {
		'use strict'


		var updateResourcesAndAssets = function( spell, assetId, asset ) {
			spell.logger.debug( 'Updating asset \'' + assetId + '\'.' )

			injectResource( spell.resources, asset )
			spell.EntityManager.updateAssetReferences( assetId, asset )
		}

		return function( spell, payload ) {
			var definition      = payload.definition,
				id              = createId( definition.namespace, definition.name ),
				assetId         = createAssetId( definition.subtype, id ),
				libraryFilePath = createLibraryFilePathFromId( id )

			var loadedAssets = {}

			loadedAssets[ libraryFilePath ] = definition
			addNamespaceAndName( loadedAssets )

			updateAssets( spell.assets, loadedAssets )

			var asset = spell.assets[ assetId ]

			if( asset.resourceId ) {
				var filesToLoad = createFilesToLoad( loadedAssets )

				if( filesToLoad.length > 0 ) {
					// when an asset references an external resource trigger loading it
					var resourceBundleId = libraryFilePath

					spell.resourceLoader.load(
						filesToLoad,
						{
							omitCache          : true,
							onLoadingCompleted : _.bind( updateResourcesAndAssets, null, spell, assetId, asset )
						}
					)
				}
			}

			updateResourcesAndAssets( spell, assetId, asset )
		}
	}
)
