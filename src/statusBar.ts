import { Disposable, MarkdownString, StatusBarAlignment, Uri, window } from 'vscode';
import { CommandIds } from './commands';
import { createFolderHoverText } from './folderHoverText';
import { TopLevelCommands } from './types';
import { forEachCommand } from './utils';

const statusBarItems: Disposable[] = [];

/** Dispose and refresh all status bar items. */
export function updateStatusBarItems(items: TopLevelCommands) {
	disposeStatusBarItems();

	forEachCommand((item, key) => {
		if (item.statusBar && !item.statusBar.hidden) {
			const statusBarUserObject = item.statusBar;
			const alignment = statusBarUserObject.alignment === 'right' ? StatusBarAlignment.Right : StatusBarAlignment.Left;
			const newStatusBarItem = window.createStatusBarItem(statusBarUserObject.text, alignment, statusBarUserObject.priority ?? -9999);
			let icon = item.icon ? `$(${item.icon}) ` : '';
			newStatusBarItem.name = statusBarUserObject.text;
			newStatusBarItem.color = statusBarUserObject.color;

			let mdTooltip = new MarkdownString(undefined, true);
			mdTooltip.isTrusted = true;
			if (statusBarUserObject.markdownTooltip) {
				mdTooltip.appendMarkdown(statusBarUserObject.markdownTooltip);
			} else {
				mdTooltip.appendText(statusBarUserObject.tooltip || key);
			}
			if (item.nestedItems) {
				icon = '$(folder) ';
				mdTooltip = createFolderHoverText(item.nestedItems);
			}
			const args = [{
				workspaceId: item.workspace,
				label: key,
			}];
			const revealCommandUri = Uri.parse(
				`command:commands.revealCommand2?${encodeURIComponent(JSON.stringify(args))}`,
			);
			mdTooltip.appendMarkdown(`\n\n---\n\n[Reveal in settings.json](${revealCommandUri})`);
			newStatusBarItem.tooltip = mdTooltip;

			newStatusBarItem.text = icon + (statusBarUserObject.text || '');
			newStatusBarItem.command = {
				command: CommandIds.run,
				title: 'Run Command',
				arguments: [item],
			};

			newStatusBarItem.show();
			statusBarItems.push(newStatusBarItem);
		}
	}, items);
}
/**
 * Dispose all status bar items.
 */
function disposeStatusBarItems() {
	for (const statusBarItem of statusBarItems) {
		statusBarItem.dispose();
	}
	statusBarItems.length = 0;
}
