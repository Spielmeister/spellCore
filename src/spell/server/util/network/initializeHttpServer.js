define(
	"spell/server/util/network/initializeHttpServer",
	[
		"spell/shared/util/Logger",

		"events",
		"fs",
		"path",
		"http",
		"url",

		"underscore"
	],
	function(
		Logger,

		events,
		fs,
		path,
		http,
		url,

		_
	) {
		"use strict"


		var contentTypes = {
			"css"  : "text/css",
			"html" : "text/html",
			"js"   : "text/javascript",
            "mp3"  : "audio/mpeg",
			"ogg"  : "audio/ogg",
			"wav"  : "audio/wav"
		}


		function initializeHttpServer( rootPath, port ) {
			var httpServer = http.createServer( _.bind( onRequest, null, rootPath ) )
			httpServer.listen( port )

			return httpServer
		}


		function onRequest( rootPath, request, response ) {
			var filePath = rootPath + '/' + createFilePath( request.url )


			if( !path.existsSync( filePath ) ) {
				Logger.warn( 'Requested file "' + filePath + '" does not exist.' )

				response.writeHead( 404, { "Content-Type": "text/plain" } )
				response.end( "Not Found" )

			} else {
				respondWithFile( filePath, response, request )
			}
		}


		/**
		 * Removes leading slash and get parameters from the url
		 *
		 * @param url
		 */
		function createFilePath( url ) {
			url = url.substring( 1, url.length )
			var index = url.indexOf( '?' )

			if( index === -1 ) return url

			return url.substring( 0, index )
		}


		function beginsWith( string, prefix ) {
			return string.indexOf( prefix ) === 0
		}


		function respondWithFile( filePath, response, request ) {
			var emitter       = new events.EventEmitter(),
				fileExtension = filePath.split('.').pop()

			process.nextTick( function() {
				var range        = ( _.has( request.headers, "range" ) ) ? request.headers.range : false
				var returnCode   = 200
				var streamConfig = {
					'flags': 'r',
					'mode' : "0666"
				}

				var stat = fs.statSync( filePath )

				if( fileExtension == 'mp3' ||
					fileExtension == 'ogg' ||
					fileExtension == 'wav' ) {


					var etag  = '"' + stat.ino + '-' + stat.size + '-' + Date.parse(stat.mtime) +'"'
					var range =  (_.has( request.headers, "range" )) ? range : false

					var ending = parseInt(stat.size) - 1
					var editorOrigin = 'http://localhost:3000'

					var headers = {
						"Accept-Ranges"               : "bytes",
						"Connection"                  : "close",
						"Content-Length"              : stat.size,
						'Content-Range'               : "bytes 0-"+ending+"/"+stat.size,
						"Content-Type"                : contentTypes[ fileExtension ],
						"Date"                        : new Date().toGMTString(),
						"ETag"                        : etag,
						"Last-Modified"               : new Date(stat.mtime).toGMTString(),
						"Server"                      : "Node",
						"Access-Control-Allow-Origin" : editorOrigin
					}

					if( request.headers['if-none-match'] == etag ) {
						headers = {
							"Connection"      : "close",
							"Date"            : new Date().toGMTString(),
							"ETag"            : etag,
							"Keep-Alive"      : "timeout=5, max=98",
							"Server"          : "Node"
						}
						response.writeHead(
							returnCode = 304,
							headers
						)

						response.end( )

					} else if( range !== false ) {

						var parts =  range.split("=").pop()

						var start = parseInt(parts.split("-").shift()),
							end   = parseInt(parts.split("-").pop())

                        start = isNaN( start ) ? 0      : start
                        end   = isNaN( end )   ? ending : end

                        streamConfig["start"]     = start
                        streamConfig['end']       = end
                        headers['Content-Range']  = "bytes "+start+"-"+end+"/"+stat.size
                        headers['Content-Length'] = (end - start) + 1

                        response.writeHead(
                            returnCode = 206,
                            headers
                        )

                        if( end == 1 ) {
                            response.end()
                        }

					} else {
						response.writeHead(
							returnCode,
							headers
						)

					}

				} else {
					response.writeHead(
						returnCode,
						{
							"Content-Length" : stat.size,
							"Content-Type"   : contentTypes[ fileExtension ],
							"Pragma"         : "no-cache",
							"Expires"        : "Mon, 27 May 1985 00:00:00 GMT",
							"Cache-Control"  : "no-cache, must-revalidate"
						}
					)
				}

				fs.createReadStream(
					filePath,
					streamConfig
				)
				.addListener( "data", function(chunk) {
                    if( returnCode != 304 )
					    response.write( chunk, 'binary')
				})
				.addListener( "end", function() {
					emitter.emit("success", 200)
				})
				.addListener("close",function() {
					response.end()
				})
				.addListener("error", function (e) {
					emitter.emit("error", 500, e)
				});

			})

		}


		return initializeHttpServer
	}
)
