// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://orchstep.dev',
	integrations: [
		starlight({
			title: 'OrchStep',
			description: 'YAML-first workflow orchestration engine',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/orchstep/orchstep' },
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
					],
				},
				{
					label: 'Specification',
					items: [
						{ label: 'Variables', slug: 'spec/variables' },
						{ label: 'Control Flow', slug: 'spec/control-flow' },
						{ label: 'Error Handling', slug: 'spec/error-handling' },
						{ label: 'Templates', slug: 'spec/templates' },
						{ label: 'Parallel Execution', slug: 'spec/parallel' },
						{ label: 'Shell Execution', slug: 'spec/shell-execution' },
					],
				},
				{
					label: 'Functions',
					items: [
						{ label: 'shell', slug: 'functions/shell' },
						{ label: 'http', slug: 'functions/http' },
						{ label: 'git', slug: 'functions/git' },
						{ label: 'assert', slug: 'functions/assert' },
						{ label: 'transform', slug: 'functions/transform' },
						{ label: 'render', slug: 'functions/render' },
						{ label: 'wait', slug: 'functions/wait' },
					],
				},
				{
					label: 'Modules',
					items: [
						{ label: 'Overview', slug: 'modules/overview' },
						{ label: 'Creating Modules', slug: 'modules/creating' },
						{ label: 'Registry', slug: 'modules/registry' },
					],
				},
				{
					label: 'LLM Agents',
					items: [
						{ label: 'Overview', slug: 'agents/overview' },
						{ label: 'MCP Server', slug: 'agents/mcp' },
						{ label: 'Skills', slug: 'agents/skills' },
					],
				},
				{
					label: 'Examples',
					items: [
						{ label: 'Showcase', slug: 'examples/showcase' },
					],
				},
				{
					label: 'Pro Features',
					items: [
						{ label: 'Overview', slug: 'pro/overview' },
					],
				},
				{
					label: 'Pricing',
					link: '/pricing',
				},
			],
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
