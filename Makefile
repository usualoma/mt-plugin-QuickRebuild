VERSION=$(shell grep -i '^version' config.yaml | sed 's/.*: *//')
BASENAME=$(shell basename `pwd`)-${VERSION}
PKGNAME=$(shell basename `pwd`)

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
	mkdir -p /tmp/${BASENAME}/plugins
	cp -pbR . /tmp/${BASENAME}/plugins/${PKGNAME}
	find /tmp/${BASENAME}/plugins/${PKGNAME} -type d -name '.svn' -or -name '.git' | xargs rm -fr
	rm -f /tmp/${BASENAME}/plugins/${PKGNAME}/Makefile
	mv /tmp/${BASENAME}/plugins/${PKGNAME}/LICENSE /tmp/${BASENAME}/
	tar zcf /tmp/${BASENAME}.tgz -C /tmp ${BASENAME}
	(cd /tmp; zip -qr ${BASENAME}.zip ${BASENAME})
