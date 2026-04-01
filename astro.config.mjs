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
						{ label: 'prompt', slug: 'functions/prompt' },
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
						{ label: 'Execution Basics', slug: 'examples/01-execution-basics' },
						{ label: 'Variables', slug: 'examples/02-variables' },
						{ label: 'Step Outputs', slug: 'examples/03-step-outputs' },
						{ label: 'Control Flow', slug: 'examples/04-control-flow' },
						{ label: 'Loops', slug: 'examples/05-loops' },
						{ label: 'Error Handling', slug: 'examples/06-error-handling' },
						{ label: 'HTTP Integration', slug: 'examples/07-http-integration' },
						{ label: 'Git Operations', slug: 'examples/08-git-operations' },
						{ label: 'Templates', slug: 'examples/09-templates-expressions' },
						{ label: 'Environment', slug: 'examples/10-environment-management' },
						{ label: 'Configuration', slug: 'examples/11-configuration' },
						{ label: 'Assertions', slug: 'examples/12-assertions' },
						{ label: 'Modules', slug: 'examples/13-modules' },
						{ label: 'Real-World Patterns', slug: 'examples/14-real-world-patterns' },
						{ label: 'Parallel Execution', slug: 'examples/15-parallel-execution' },
						{ label: 'User Prompts', slug: 'examples/16-user-prompts' },
						{ label: 'Task Discovery', slug: 'examples/17-task-discovery' },
						{ label: 'Nested Patterns', slug: 'examples/18-nested-patterns' },
					],
				},
				{
					label: 'Demos',
					items: [
						{ label: 'Use Cases', slug: 'demos/use-cases' },
					],
				},
				{
					label: 'Showcases',
					items: [
						{ label: 'Enterprise Showcases', slug: 'showcases/overview' },
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
