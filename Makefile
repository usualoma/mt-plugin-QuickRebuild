BASENAME=$(shell basename `pwd`)_$(shell cat VERSION)_$(shell date '+%Y%m%d')

dist:
	rm -fr /tmp/${BASENAME}
	cp -pbR . /tmp/${BASENAME}
	find /tmp/${BASENAME} -type d -name '.svn' | xargs rm -fr
	tar zcf /tmp/${BASENAME}.tgz -C /tmp ${BASENAME}
	(cd /tmp; zip -qr ${BASENAME}.zip ${BASENAME})
