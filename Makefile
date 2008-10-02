VERSION=$(shell grep -i '^version' config.yaml | sed 's/.*: *//')
BASENAME=$(shell basename `pwd`)-${VERSION}

PROJECT=$(shell svn info | grep ^URL | sed 's/.*:\/\///' | sed 's/\.googlecode\.com.*//')
URL=$(shell svn info | grep ^URL | sed 's/.*URL: *//' | sed 's/\(\.googlecode\.com\/svn\/\).*/\1/')

all: 

make_tag:
	svn commit
	svn copy ${URL}trunk/ ${URL}tags/release_${VERSION} -m 'release ${VERSION}'

upload_google: dist
	googlecode_upload.py -s 'Release ${VERSION} (TGZ)' -p $(PROJECT) /tmp/${BASENAME}.tgz
	googlecode_upload.py -s 'Release ${VERSION} (ZIP)' -p $(PROJECT) /tmp/${BASENAME}.zip

dist:
	rm -fr /tmp/${BASENAME}
	cp -pbR . /tmp/${BASENAME}
	find /tmp/${BASENAME} -type d -name '.svn' | xargs rm -fr
	rm -f /tmp/${BASENAME}/Makefile
	tar zcf /tmp/${BASENAME}.tgz -C /tmp ${BASENAME}
	(cd /tmp; zip -qr ${BASENAME}.zip ${BASENAME})
