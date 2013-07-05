NEEDJS_LIB                  = src/need.js
SPELL_COMMON_OPTIONS        = -s src -m spell/client/main -i spell/shared/util/platform/private
SPELL_COMMON_LIB            = build/spellCore/lib/spell.common.js
SPELL_COMMON_MIN_LIB        = build/spellCore/lib/spell.common.min.js
SPELL_HTML5_ADAPTER_OPTIONS = -s src -m spell/client/main -i spell/shared/util/platform/private -e spell/shared/util/platform/private
SPELL_LOADER_LIB            = build/spellCore/lib/spell.loader.js
SPELL_LOADER_MIN_LIB        = build/spellCore/lib/spell.loader.min.js
SPELL_HTML5_ADAPTER_LIB     = build/spellCore/lib/spell.html5.js
SPELL_HTML5_ADAPTER_MIN_LIB = build/spellCore/lib/spell.html5.min.js
SPELL_ENGINE_DEBUG_LIB      = build/spellCore/lib/spell.debug.js
SPELL_ENGINE_RELEASE_LIB    = build/spellCore/lib/spell.release.js
SPELL_CLI_LIB               = build/spellCore/lib/spell.cli.js
SPELL_CORE_OUT_DIR          = build/spellCore
SPELL_CORE_OUT_LIB_DIR      = $(SPELL_CORE_OUT_DIR)/lib
SPELL_FLASH_DIR             = ../spellFlash
FLEX_SDK_DIR                = $(SPELL_FLASH_DIR)/vendor/flex_sdk_4.8.0
SPELL_FLASH_OUT_DIR         = build/spellFlash
FLEX_SDK_OUT_DIR            = $(SPELL_FLASH_OUT_DIR)/vendor/flex_sdk
NODE                        = ../nodejs/node
NODE_SRC                    = ../nodejs/src
NODE_PATH                   = $$(../nodejs/node --which)

UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
	SED = sed -i "" -e
else
	SED = sed -i
endif

WINDOWS_ENV = false

ifeq ($(UNAME_S),CYGWIN_NT-6.1-WOW64)
	WINDOWS_ENV = true
	VISUAL_STUDIO_PATCH_FILE = nodejs_vs10.patch
endif

ifeq ($(UNAME_S),CYGWIN_NT-6.2-WOW64)
	WINDOWS_ENV = true
	VISUAL_STUDIO_PATCH_FILE = nodejs_vs11.patch
endif


.PHONY: cli-js
cli-js:
	# creating the javascript includes for the command line tool
	mkdir -p $(SPELL_CORE_OUT_LIB_DIR)

	cat spell.cli.js > $(SPELL_CLI_LIB)
	$(NODE) tools/n.js -s src -m spell/cli/developmentTool -i "fs,mkdirp,path,uglify-js,amd-helper,flob,child_process,xmlbuilder,os,underscore.string,rimraf,zipstream,util,commander,ff,spell-license" >> $(SPELL_CLI_LIB)


.PHONY: cli
cli: cli-js flash-target-builder-deps
	#reseting node src directory
	cd $(NODE_SRC) && git reset --hard master

	#patching nodejs src
	cd $(NODE_SRC) && patch -p1 <../../../modules/spellCore/nodejs_spellCore_integration.patch

	# creating cli executable
	mv $(SPELL_CLI_LIB) $(NODE_SRC)/lib/_third_party_main.js

	#patch includes in _third_party_main.js
	$(SED) 's/uglify-js/uglifyjs/g' $(NODE_SRC)/lib/_third_party_main.js

	#integrate requirejs
	tail -n +2 ../../node_modules/requirejs/bin/r.js >$(NODE_SRC)/lib/requirejs.js

	#integrate mkdirp
	cp ../../node_modules/mkdirp/index.js $(NODE_SRC)/lib/mkdirp.js

	#integrate uglify-js
	cp ../../node_modules/uglify-js/uglify-js.js $(NODE_SRC)/lib/uglifyjs.js
	cp ../../node_modules/uglify-js/lib/process.js $(NODE_SRC)/lib/uglifyjs_process.js
	cp ../../node_modules/uglify-js/lib/parse-js.js $(NODE_SRC)/lib/uglifyjs_parsejs.js
	cp ../../node_modules/uglify-js/lib/squeeze-more.js $(NODE_SRC)/lib/uglifyjs_squeezemore.js
	cp ../../node_modules/uglify-js/lib/consolidator.js $(NODE_SRC)/lib/uglifyjs_consolidator.js
	$(SED) 's/\.\/lib\/parse-js/uglifyjs_parsejs/g' $(NODE_SRC)/lib/*.js
	$(SED) 's/\.\/parse-js/uglifyjs_parsejs/g' $(NODE_SRC)/lib/*.js
	$(SED) 's/\.\/lib\/process/uglifyjs_process/g' $(NODE_SRC)/lib/*.js
	$(SED) 's/\.\/process/uglifyjs_process/g' $(NODE_SRC)/lib/*.js
	$(SED) 's/\.\/lib\/squeeze-more/uglifyjs_squeezemore/g' $(NODE_SRC)/lib/*.js
	$(SED) 's/\.\/squeeze-more/uglifyjs_squeezemore/g' $(NODE_SRC)/lib/*.js
	$(SED) 's/\.\/lib\/consolidator/uglifyjs_consolidator/g' $(NODE_SRC)/lib/*.js
	$(SED) 's/\.\/consolidator/uglifyjs_consolidator/g' $(NODE_SRC)/lib/*.js

	#integrate underscore
	cp ../../node_modules/underscore/underscore.js $(NODE_SRC)/lib/underscore.js

	#integrate ff
	cp ../../node_modules/ff/lib/ff.js $(NODE_SRC)/lib/ff.js

	#integrate amd-helper
	cp ../../node_modules/amd-helper/lib/index.js $(NODE_SRC)/lib/amdhelper.js
	cp ../../node_modules/amd-helper/lib/createModuleHeader.js $(NODE_SRC)/lib/amdhelper_createModuleHeader.js
	cp ../../node_modules/amd-helper/lib/extractModuleHeader.js $(NODE_SRC)/lib/amdhelper_extractModuleHeader.js
	cp ../../node_modules/amd-helper/lib/loadModule.js $(NODE_SRC)/lib/amdhelper_loadModule.js
	cp ../../node_modules/amd-helper/lib/loadModules.js $(NODE_SRC)/lib/amdhelper_loadModules.js
	cp ../../node_modules/amd-helper/lib/traceDependencies.js $(NODE_SRC)/lib/amdhelper_traceDependencies.js
	$(SED) 's/amd-helper/amdhelper/g' $(NODE_SRC)/lib/*.js
	$(SED) 's/.\/extractModuleHeader/amdhelper_extractModuleHeader/g' $(NODE_SRC)/lib/*.js
	$(SED) 's/.\/loadModule/amdhelper_loadModule/g' $(NODE_SRC)/lib/*.js
	$(SED) 's/.\/createModuleHeader/amdhelper_createModuleHeader/g' $(NODE_SRC)/lib/*.js
	$(SED) 's/.\/traceDependencies/amdhelper_traceDependencies/g' $(NODE_SRC)/lib/*.js
	$(SED) 's/uglify-js/uglifyjs/g' $(NODE_SRC)/lib/*.js

	#integrate flob
	cp ../../node_modules/flob/lib/index.js $(NODE_SRC)/lib/flob.js
	cp ../../node_modules/flob/lib/byTypes.js $(NODE_SRC)/lib/flob_byTypes.js
	cp ../../node_modules/flob/lib/sync.js $(NODE_SRC)/lib/flob_sync.js
	$(SED) 's/.\/byTypes/flob_byTypes/g' $(NODE_SRC)/lib/flob.js
	$(SED) 's/.\/sync/flob_sync/g' $(NODE_SRC)/lib/flob.js

	#integrate glob
	cp ../../node_modules/glob/glob.js $(NODE_SRC)/lib/glob.js

	#integrate graceful-fs (dependency for glob)
	cp ../../node_modules/glob/node_modules/graceful-fs/graceful-fs.js $(NODE_SRC)/lib/gracefulfs.js
	$(SED) 's/graceful-fs/gracefulfs/g' $(NODE_SRC)/lib/*.js

	#integrate minimatch (dependency for glob)
	cp ../../node_modules/glob/node_modules/minimatch/minimatch.js $(NODE_SRC)/lib/minimatch.js

	#integrate lru-cache (dependency for minimatch)
	cp ../../node_modules/glob/node_modules/minimatch/node_modules/lru-cache/lib/lru-cache.js $(NODE_SRC)/lib/lrucache.js
	$(SED) 's/lru-cache/lrucache/g' $(NODE_SRC)/lib/*.js

	#integrate inherits
	cp ../../node_modules/glob/node_modules/inherits/inherits.js $(NODE_SRC)/lib/inherits.js

	#integrate underscore.string
	cp ../../node_modules/underscore.string/lib/underscore.string.js $(NODE_SRC)/lib/underscorestring.js
	$(SED) 's/underscore.string/underscorestring/g' $(NODE_SRC)/lib/*.js

	#integrate xmlbuilder
	cp ../../node_modules/xmlbuilder/lib/index.js $(NODE_SRC)/lib/xmlbuilder.js
	cp ../../node_modules/xmlbuilder/lib/XMLBuilder.js $(NODE_SRC)/lib/xmlbuilder_XMLBuilder.js
	cp ../../node_modules/xmlbuilder/lib/XMLFragment.js $(NODE_SRC)/lib/xmlbuilder_XMLFragment.js
	$(SED) 's/.\/XMLBuilder/xmlbuilder_XMLBuilder/g' $(NODE_SRC)/lib/xmlbuilder*.js
	$(SED) 's/.\/XMLFragment/xmlbuilder_XMLFragment/g' $(NODE_SRC)/lib/xmlbuilder*.js

	#integrate rimraf
	cp ../../node_modules/rimraf/rimraf.js $(NODE_SRC)/lib/rimraf.js

	#integrate zipstream
	cp ../../node_modules/zipstream/zipstream.js $(NODE_SRC)/lib/zipstream.js
	cp ../../node_modules/zipstream/crc32.js $(NODE_SRC)/lib/zipstream_crc32.js
	$(SED) 's/.\/crc32/zipstream_crc32/g' $(NODE_SRC)/lib/zipstream.js

	#integrate commander
	cp ../../node_modules/commander/lib/commander.js $(NODE_SRC)/lib/commander.js

	#integrate spell-license
	cp ../../node_modules/spell-license/lib/index.js $(NODE_SRC)/lib/spelllicense.js
	$(SED) 's/spell-license/spelllicense/g' $(NODE_SRC)/lib/*.js

	#compile nodejs
ifeq ($(WINDOWS_ENV),true)
	cd $(NODE_SRC) && patch -p1 <../../../modules/spellCore/$(VISUAL_STUDIO_PATCH_FILE)

	cd $(NODE_SRC) && ./vcbuild.bat
	cp $(NODE_SRC)/Release/node.exe build/spellcli.exe
	../upx/upx -9 build/spellcli.exe
else
	cd $(NODE_SRC) && make clean && ./configure && make -j4
	cp $(NODE_SRC)/out/Release/node build/spellcli
	../upx/upx -9 build/spellcli
endif


.PHONY: deploy
deploy: engine-release cli


.PHONY: flash-target-builder-deps
flash-target-builder-deps:
	mkdir -p $(FLEX_SDK_OUT_DIR)/bin $(FLEX_SDK_OUT_DIR)/lib

	# 3rd party libraries
	cp -R $(SPELL_FLASH_DIR)/lib $(SPELL_FLASH_DIR)/src $(SPELL_FLASH_OUT_DIR)

	# mxmlc and dependencies
	mkdir -p $(FLEX_SDK_OUT_DIR)/frameworks
	mkdir -p $(FLEX_SDK_OUT_DIR)/frameworks/libs/player/11.1
	mkdir -p $(FLEX_SDK_OUT_DIR)/frameworks/themes/Spark

	cp $(FLEX_SDK_DIR)/bin/mxmlc* $(FLEX_SDK_OUT_DIR)/bin
	cp $(FLEX_SDK_DIR)/frameworks/localFonts.ser $(FLEX_SDK_OUT_DIR)/frameworks
	cp $(FLEX_SDK_DIR)/frameworks/libs/player/11.1/playerglobal.swc $(FLEX_SDK_OUT_DIR)/frameworks/libs/player/11.1
	cp $(FLEX_SDK_DIR)/frameworks/themes/Spark/spark.css $(FLEX_SDK_OUT_DIR)/frameworks/themes/Spark
	cp $(FLEX_SDK_DIR)/lib/asc.jar $(FLEX_SDK_OUT_DIR)/lib
	cp $(FLEX_SDK_DIR)/lib/fxgutils.jar $(FLEX_SDK_OUT_DIR)/lib
	cp $(FLEX_SDK_DIR)/lib/mxmlc* $(FLEX_SDK_OUT_DIR)/lib
	cp $(FLEX_SDK_DIR)/lib/swfutils.jar $(FLEX_SDK_OUT_DIR)/lib
	cp $(FLEX_SDK_DIR)/lib/velocity-dep-1.4-flex.jar $(FLEX_SDK_OUT_DIR)/lib


.PHONY: engine-debug
engine-debug: clean $(SPELL_ENGINE_DEBUG_LIB) $(SPELL_ENGINE_RELEASE_LIB) additional-dependencies


.PHONY: engine-release
engine-release: clean $(SPELL_ENGINE_RELEASE_LIB) additional-dependencies
	# deleting unminified files
	rm -f $(SPELL_COMMON_LIB) $(SPELL_HTML5_ADAPTER_LIB) $(SPELL_LOADER_LIB) $(SPELL_ENGINE_DEBUG_LIB)


.PHONY: additional-dependencies
additional-dependencies:
	# copy additional dependencies to output directory
	cp -R library $(SPELL_CORE_OUT_DIR)
	cp -R htmlTemplate $(SPELL_CORE_OUT_DIR)


$(SPELL_ENGINE_DEBUG_LIB): $(SPELL_COMMON_LIB) $(SPELL_HTML5_ADAPTER_LIB) $(SPELL_LOADER_LIB)
	# build engine library for debug mode
	cat $(NEEDJS_LIB) $(SPELL_COMMON_LIB) $(SPELL_HTML5_ADAPTER_LIB) > $(SPELL_ENGINE_DEBUG_LIB)


$(SPELL_ENGINE_RELEASE_LIB): $(SPELL_COMMON_MIN_LIB) $(SPELL_HTML5_ADAPTER_MIN_LIB) $(SPELL_LOADER_MIN_LIB)
	# build engine library for release mode
	$(NODE) tools/n.js mangle $(NEEDJS_LIB) > $(SPELL_ENGINE_RELEASE_LIB)
	cat $(SPELL_COMMON_MIN_LIB) $(SPELL_HTML5_ADAPTER_MIN_LIB) >> $(SPELL_ENGINE_RELEASE_LIB)


$(SPELL_COMMON_LIB):
	mkdir -p $(SPELL_CORE_OUT_LIB_DIR)
	$(NODE) tools/n.js $(SPELL_COMMON_OPTIONS) > $(SPELL_COMMON_LIB)


$(SPELL_COMMON_MIN_LIB): $(SPELL_COMMON_LIB)
	$(NODE) tools/n.js mangle $(SPELL_COMMON_LIB) > $(SPELL_COMMON_MIN_LIB)


$(SPELL_HTML5_ADAPTER_LIB):
	mkdir -p $(SPELL_CORE_OUT_LIB_DIR)
	$(NODE) tools/n.js $(SPELL_HTML5_ADAPTER_OPTIONS) > $(SPELL_HTML5_ADAPTER_LIB)


$(SPELL_HTML5_ADAPTER_MIN_LIB): $(SPELL_HTML5_ADAPTER_LIB)
	$(NODE) tools/n.js mangle $(SPELL_HTML5_ADAPTER_LIB) > $(SPELL_HTML5_ADAPTER_MIN_LIB)


$(SPELL_LOADER_LIB):
	mkdir -p $(SPELL_CORE_OUT_LIB_DIR)
	cp src/spell/client/stageZeroLoader.js $(SPELL_LOADER_LIB)


$(SPELL_LOADER_MIN_LIB): $(SPELL_LOADER_LIB)
	$(NODE) tools/n.js mangle $(SPELL_LOADER_LIB) > $(SPELL_LOADER_MIN_LIB) --no-anonymization


.PHONY: clean
clean:
	rm -rf build/*


.PHONY: docs
docs:
	jsduck --config docs/jsduck_conf.json
	cp docs/css/*.css docs/generated/resources/css
	cp docs/images/* docs/generated/resources/images
	cp docs/favicon.ico docs/generated/favicon.ico
