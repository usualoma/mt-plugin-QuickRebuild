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

	my $new_tmpl = <<'__EOH__';
                        <li id="quick-rebuild-site" class="nav-link"><a href="javascript:void(0)" title="<__trans phrase="Quick Publish Site">" onclick="window.open('<$mt:var name="mt_url"$>?__mode=rebuild_confirm&amp;blog_id=<$mt:var name="blog_id"$>&amp;quick_rebuild=1', 'quick_rebuild', 'width=400,height=400,resizable=yes'); return false">QR</a></li>
__EOH__

	my $new = $plugin->translate_templatized($new_tmpl);
	my $old = '<li id="rebuild-site" class="nav-link">';

	$$tmpl =~ s/($old)/$new\n$old/;

	my $rebuld_script = <<'__EOS__';
<script type="text/javascript">
(function() {
	var links = document.getElementsByTagName('a');
	for (var i = 0; i < links.length; i++) {
		if (/__mode=rebuild_all_blog/.test(links[i].href)) {
			links[i].href = "javascript:(function(){var%20s=document.createElement(%22script%22);s.charset=%22UTF-8%22;s.src=%22<$mt:var name="mt_url"$>?__mode=rebuild_all_blog_js%22;document.body.appendChild(s)})();"
		}
	}
})();
</script>
__EOS__

	$$tmpl .= $plugin->translate_templatized($rebuld_script);

	if ($app->can('param') && (! $app->param('blog_id'))) {
		my $new_tmpl = <<'__EOH__';
                        <li id="quick-rebuild-site" class="nav-link"><a href="<$mt:var name="mt_url"$>?__mode=rebuild_all_blog" title="<__trans phrase="Rebuild all blog">">QR</a></li>
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
document.forms[0].submit()
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

	var buttons = document.getElementsByTagName('button');
	for (var i = 0; i < buttons.length; i++) {
		if (buttons[i].accessKey == 's') {
			buttons[i].onclick = function() {
				window.location = '<mt:var name="script_url">?__mode=rebuild_confirm&amp;blog_id=<mt:var name="blog_id">&amp;quick_rebuild=1';
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

1;
