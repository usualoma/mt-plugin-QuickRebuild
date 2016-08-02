all:
	install -d tree/master/plugins/QuickRebuild/tmpl
	for name in `git tag | grep ^v`; do \
		d=tree/$$name/plugins/QuickRebuild/tmpl; \
		install -d $$d; \
		git show $$name:plugins/QuickRebuild/tmpl/mt-rebuild.js > $$d/mt-rebuild.js; \
		git show $$name:plugins/QuickRebuild/tmpl/mt-rebuild-current-tag.js > tree/master/plugins/QuickRebuild/tmpl/mt-rebuild-current-tag.js; \
	done
