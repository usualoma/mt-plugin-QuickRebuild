#   Copyright (c) 2008 ToI-Planning, All rights reserved.
# 
#   Redistribution and use in source and binary forms, with or without
#   modification, are permitted provided that the following conditions
#   are met:
# 
#   1. Redistributions of source code must retain the above copyright
#      notice, this list of conditions and the following disclaimer.
#
#   2. Redistributions in binary form must reproduce the above copyright
#      notice, this list of conditions and the following disclaimer in the
#      documentation and/or other materials provided with the distribution.
#
#   3. Neither the name of the authors nor the names of its contributors
#      may be used to endorse or promote products derived from this
#      software without specific prior written permission.
#
#   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
#   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
#   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
#   A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
#   OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
#   SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
#   TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
#   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
#   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
#   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
#   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#
#  $Id$

package QuickRebuild::App;
use strict;

sub template_source_header {
	my ($cb, $app, $tmpl) = @_;
	my $plugin = $app->component('QuickRebuild');

	if (0) {
		my $new_tmpl = <<'__EOH__';
							<li id="quick-rebuild-site" class="nav-link"><a href="javascript:void(0)" title="<__trans phrase="Quick Publish Site">" onclick="window.open('<$mt:var name="mt_url"$>?__mode=rebuild_confirm&amp;blog_id=<$mt:var name="blog_id"$>&amp;quick_rebuild=1', 'quick_rebuild', 'width=400,height=400,resizable=yes'); return false">QR</a></li>
__EOH__

		my $new = $plugin->translate_templatized($new_tmpl);
		my $old = '<li id="rebuild-site" class="nav-link">';

		$$tmpl =~ s/($old)/$new\n$old/;
	}

	if (0) {
		$$tmpl =~ s/<li\s*id="rebuild-site"(.|\n|\r)*?<\/li>//i;
	}

	my $rebuld_script = <<'__EOS__';
<script type="text/javascript">
(function() {
	function replace() {
	}
	var int = setInterval(function() {
		if (document.getElementById('footer')) {
			clearInterval(int);
			var links = document.getElementsByTagName('a');
			for (var i = 0; i < links.length; i++) {
				if (/__mode=rebuild_all_blog/.test(links[i].href)) {
					links[i].href = "javascript:;";
					links[i].onclick = function() {
						window.open(
							'<$mt:var name="mt_url"$>?__mode=quick_rebuild_all',
							'quick_rebuild',
							'width=400,height=400,resizable=yes'
						);
					};
				}
				if (/quick_rebuild=1/.test(links[i].href)) {
					links[i].onclick = function() {
						window.open(
							this.href,
							'quick_rebuild',
							'width=400,height=400,resizable=yes'
						);
						return false;
					};
				}
			}
		}
	}, 200);
})();
</script>
__EOS__

	$$tmpl .= $plugin->translate_templatized($rebuld_script);

	if ($app->can('param') && (! $app->param('blog_id'))) {
		my $new_tmpl = <<'__EOH__';
                        <li id="quick-rebuild-site" class="nav-link"><a href="<$mt:var name="mt_url"$>?__mode=rebuild_all_blog" title="<__trans phrase="Rebuild all blog">"><__trans phrase="Rebuild"></a></li>
__EOH__

		my $new = $plugin->translate_templatized($new_tmpl);
		$$tmpl =~ s/(id="view-site"(.|\r|\n)*?)(<\/ul>)/$1$new$2/si;
	}

	$$tmpl;
}

sub template_source_rebuild_confirm {
	my ($cb, $app, $tmpl) = @_;
	my $plugin = $app->component('QuickRebuild');
	my $blog_id = $app->param('blog_id') or return;

	if (
		(! $app->can('param'))
		|| (! $app->param('quick_rebuild'))
	) {
		return;
	}

	my $new_tmpl = <<'__EOH__';
<script type="text/javascript">
(function() {
	var type = /quick_rebuild_type=([^&]*)/i.exec(location.search);
	if (type && type[1]) {
		var opts = document.forms[0].type.options;
		for (var i = 0; i < opts.length; i++) {
			if (opts[i].value == type[1]) {
				opts[i].selected = 'selected';
			}
			else {
				opts[i].selected = '';
			}
		}
		document.cookie = 'quick_rebuild_type=' + type[1];
	}
	else {
		document.cookie = 'quick_rebuild_type=0; max-age=0';
	}
	document.forms[0].submit()
})();
</script>
__EOH__

	my $new = $plugin->translate_templatized($new_tmpl);
	my $old = '</form>';

	$$tmpl =~ s/($old)/$old\n$new/;

	$$tmpl;
}

sub template_source_rebuilt {
	my ($cb, $app, $tmpl) = @_;
	my $plugin = $app->component('QuickRebuild');

	my $new_tmpl = <<'__EOH__';
<script type="text/javascript">
(function() {
	if (window.name != 'quick_rebuild') {
		return;
	}
	var url = '<mt:var name="script_url">?__mode=rebuild_confirm&amp;blog_id=<mt:var name="blog_id">&amp;quick_rebuild=1';

	var type = /(^|;\s*)quick_rebuild_type=([^;]*)/i.exec(document.cookie);
	if (type) {
		url += '&amp;quick_rebuild_type=' + type[2];
	}
	document.cookie = 'quick_rebuild_type=0; max-age=0';

	var buttons = document.getElementsByTagName('button');
	for (var i = 0; i < buttons.length; i++) {
		if (buttons[i].accessKey == 's') {
			buttons[i].onclick = function() {
				window.location = url;
			}
		}
	}
})();
</script>
__EOH__

	my $new = $plugin->translate_templatized($new_tmpl);
	my $old = '<mt:include name="include/chromeless_footer.tmpl">';

	$$tmpl =~ s/($old)/$new\n$old/;

	$$tmpl;
}

sub rebuild_all_blog_js {
    my $app = shift;
    my ($param) = @_;
    $param ||= {};

	my $plugin = MT->component('QuickRebuild');
	my $edit_tmpl = File::Spec->catdir(
		$plugin->{full_path}, 'tmpl', 'mt-rebuild.js'
	);

	$app->{no_print_body} = 1;
	$app->send_http_header("text/javascript");
	open(my $fh, $edit_tmpl);
	$app->print(do{ local $/; <$fh> });
}

sub quick_rebuild_all {
    my $app = shift;
    my ($param) = @_;
    $param ||= {};

	my $plugin = MT->component('QuickRebuild');
	my $edit_tmpl = File::Spec->catdir(
		$plugin->{full_path}, 'tmpl', 'quick_rebuild_all.tmpl'
	);

	$app->load_tmpl($edit_tmpl, $param);
}

sub init_app {
	my ($plugin, $app) = @_;

	require CGI;
	my $q = new CGI;
	my $blog_id = $q->param('blog_id')
		or return;

    require MT::Blog;
    my $blog = MT::Blog->load($blog_id);
    my $at = $blog->archive_type || '';

	if ( $at && $at ne 'None' ) {
		$at = ',' . $at . ',';

		my $menus = $plugin->{registry}->{applications}->{cms}->{menus};

		require MT::WeblogPublisher;
		#my $types = MT::WeblogPublisher::core_archive_types;
		my $types = MT::WeblogPublisher->core_archive_types;
		my $order = 200;
		foreach my $k (keys(%$types)) {
			if ($at !~ m/,$k,/) {
				next;
			}
			my $t = $types->{$k};
			(my $phrase = $t->{name}) =~ s/-/ /;
			$menus->{'quickrebuild:' . $k} = {
				label => $app->translate(
					'Only [_1] Archives', $app->translate($phrase)
				),
				order => $order,
				mode => 'rebuild_confirm',
				args => {
					'quick_rebuild' => 1,
					'quick_rebuild_type', => $k,
				},
			};
			$order += 100;
		}
	}
}

1;
