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

use File::Basename;

sub template_source_header {
	if (MT->version_number >= 5) {
		&template_source_header_5;
	}
	else {
		&template_source_header_4;
	}
}

sub template_source_header_4 {
	my ($cb, $app, $tmpl) = @_;
	my $plugin = $app->component('QuickRebuild');

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

	$$tmpl .= <<__EOM__;
<style type="text/css">
html li#quickrebuild-menu ul {
	width: auto;
}
</style>
__EOM__

	if ($app->can('param') && (! $app->param('blog_id'))) {
		my $new_tmpl = <<'__EOH__';
                        <li id="quick-rebuild-site" class="nav-link"><a href="<$mt:var name="mt_url"$>?__mode=rebuild_all_blog" title="<__trans phrase="Rebuild all blog">"><__trans phrase="Rebuild"></a></li>
__EOH__

		my $new = $plugin->translate_templatized($new_tmpl);
		$$tmpl =~ s/(id="view-site"(.|\r|\n)*?)(<\/ul>)/$1$new$2/si;
	}

	$$tmpl;
}

sub template_source_header_5 {
	my ($cb, $app, $tmpl) = @_;
	my $plugin = $app->component('QuickRebuild');
	my $blog = $app->blog;

	if (! $blog || $blog->class eq 'website' || 1) {
		if ($blog && $blog->is_blog) {
			$blog = $blog->website;
		}

		my $static = $app->static_path;
		my $plugin_name = basename($plugin->{full_path});
		my $dir = basename(dirname($plugin->{full_path}));
		my $blog_id = $blog ? ('&blog_id=' . $blog->id) : '';
		my $rebuld_script = <<__EOS__;
<script type="text/javascript">
if (typeof(jQuery) != 'undefined') {
jQuery(function(j) {

var list = j('#menu-bar-icons');
if (list.length == 0) {
	j('#menu-bar').append('<ul id="menu-bar-list"></ul>');
	list = j('#menu-bar-list');
}

list.prepend(
	'<li id="rebuild-site" class="nav-link"><a href="#" title="<__trans phrase="Rebuild all blog">" id="quick_rebuild_all" style="background-image: url(' + "'${static}${dir}/${plugin_name}/images/nav-icon-power-publish.png'" + ');"><span><__trans phrase="Publish"></span></a></li>'
);

j('#quick_rebuild_all').click(function(ev) {
	ev.preventDefault();
	ev.stopPropagation();

	window.open(
		'<mt:var name="mt_url" />?__mode=quick_rebuild_all$blog_id',
		'quick_rebuild',
		'width=400,height=400,resizable=yes'
	);
});

j('#menu-quickrebuild a').click(function(ev) {
	ev.preventDefault();
	ev.stopPropagation();

	window.open(
		this.href,
		'quick_rebuild',
		'width=400,height=400,resizable=yes'
	);
});

});
}
</script>
__EOS__

		$$tmpl .= $plugin->translate_templatized($rebuld_script);
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

	$app->{cgi_headers}{'Content-Type'} = 'text/javascript; charset=UTF-8';
	open(my $fh, $edit_tmpl);
	do{ local $/; <$fh> };
}

sub quick_rebuild_all {
	if (MT->version_number >= 5) {
		&quick_rebuild_all_5;
	}
	else {
		&quick_rebuild_all_4;
	}
}

sub quick_rebuild_all_5 {
    my $app = shift;
    my ($param) = @_;
    $param ||= {};

	my $website_terms = undef;
	if (my $blog_id = $app->param('blog_id')) {
		$website_terms = { 'id' => $blog_id };
	}

	my $sites = [];
	my $iter = MT->model('website')->load_iter(
		$website_terms,
		{
			'sort' => 'id',
		}
	);
	while (my $site = $iter->()) {
		my $blogs = [];
		my $iter = MT->model('blog')->load_iter({
			'parent_id' => $site->id,
		});
		while (my $blog = $iter->()) {
			if ($app->user->blog_perm($blog->id)->can_rebuild) {
				push(@$blogs, $blog);
			}
		}

		my $site_perm = $app->user->blog_perm($site->id);
		if (@$blogs || $site_perm->can_rebuild) {
			push(@$sites, {
				'id'          => $site->id,
				'name'        => $site->name,
				'can_rebuild' => $site_perm->can_rebuild,
				'blogs'       => $blogs,
			});
		}
	}
	$param->{'sites'} = $sites;

	my $plugin = MT->component('QuickRebuild');
	$plugin->load_tmpl('quick_rebuild_all_5.tmpl', $param);
}

sub quick_rebuild_all_4 {
    my $app = shift;
    my ($param) = @_;
    $param ||= {};

	my $blogs = [];
	my $iter = MT->model('blog')->load_iter(
		undef,
		{
			'sort' => 'id',
		}
	);
	while (my $blog = $iter->()) {
		if ($app->user->blog_perm($blog->id)->can_rebuild) {
			push(@$blogs, $blog);
		}
	}
	$param->{'blogs'} = $blogs;

	my $plugin = MT->component('QuickRebuild');
	my $edit_tmpl = File::Spec->catdir(
		$plugin->{full_path}, 'tmpl', 'quick_rebuild_all_4.tmpl'
	);

	$app->load_tmpl($edit_tmpl, $param);
}

sub init_app {
    my ( $cb, $app ) = @_;
    my $plugin = MT->component('QuickRebuild');

    my $menus = $plugin->registry( 'applications', 'cms', 'menus' );

    require MT::WeblogPublisher;
    my $types = MT::WeblogPublisher->core_archive_types;
    my $order = 200;
    foreach my $k ( keys(%$types) ) {
        my $t = $types->{$k};

        my $phrase = ( ref $t ) ? $t->{name} : $t;
        $phrase =~ s/.*:://;
        $phrase =~ s/-/ /;
        $phrase =~ s/(?<=[a-z])([A-Z])/ $1/g;

        $menus->{ 'quickrebuild:' . $k } = {
            label => sub {
                $app->translate( 'Only [_1] Archives',
                    $app->translate($phrase) );
            },
            order => $order,
            mode  => 'rebuild_confirm',
            args  => {
                'quick_rebuild'       => 1,
                'quick_rebuild_type', => $k,
            },
            view      => [qw(website blog)],
            condition => sub {
                my $at = MT->instance->blog->archive_type || '';
                $at =~ m/(^|,)$k(,|$)/;
            },
        };
        $order += 100;
    }
}

1;
