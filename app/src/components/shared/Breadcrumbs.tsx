import React from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
}

/**
 * Breadcrumbs component for navigation hierarchy display
 * 
 * Features:
 * - Supports both href (Link) and onClick navigation
 * - Truncates items when exceeding maxItems (shows first, ellipsis, last items)
 * - Customizable separator
 * - Accessible with proper ARIA labels
 * 
 * @example
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Cultura', href: '/cultura' },
 *     { label: 'Maputo', href: '/cultura/maputo' },
 *     { label: 'Tradições' }
 *   ]}
 *   maxItems={4}
 * />
 * ```
 */
export function Breadcrumbs({ items, separator, maxItems = 5 }: BreadcrumbsProps) {
  // Handle empty items
  if (!items || items.length === 0) {
    return null;
  }

  // Determine if truncation is needed
  const shouldTruncate = maxItems > 0 && items.length > maxItems;

  // Calculate which items to show
  const getDisplayItems = (): BreadcrumbItem[] => {
    if (!shouldTruncate) {
      return items;
    }

    // Show first item, ellipsis, and last (maxItems - 2) items
    // For maxItems=3: [first, ..., last]
    // For maxItems=4: [first, ..., secondLast, last]
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 2));
    
    return [firstItem, ...lastItems];
  };

  // Get hidden items for the dropdown
  const getHiddenItems = (): BreadcrumbItem[] => {
    if (!shouldTruncate) {
      return [];
    }

    // Hidden items are between first and last (maxItems - 2) items
    return items.slice(1, -(maxItems - 2));
  };

  const displayItems = getDisplayItems();
  const hiddenItems = getHiddenItems();

  // Render a single breadcrumb item
  const renderItem = (item: BreadcrumbItem, isLast: boolean) => {
    const content = (
      <>
        {item.icon && <span className="mr-1.5">{item.icon}</span>}
        {item.label}
      </>
    );

    if (isLast) {
      return <BreadcrumbPage>{content}</BreadcrumbPage>;
    }

    if (item.href) {
      return (
        <BreadcrumbLink asChild>
          <Link to={item.href}>{content}</Link>
        </BreadcrumbLink>
      );
    }

    if (item.onClick) {
      return (
        <BreadcrumbLink asChild>
          <button
            onClick={item.onClick}
            className="inline-flex items-center"
            type="button"
          >
            {content}
          </button>
        </BreadcrumbLink>
      );
    }

    // If no href or onClick, render as plain text
    return <span className="inline-flex items-center">{content}</span>;
  };

  // Render ellipsis dropdown with hidden items
  const renderEllipsis = () => {
    if (hiddenItems.length === 0) {
      return null;
    }

    return (
      <>
        <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1" aria-label="Show more breadcrumbs">
              <BreadcrumbEllipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {hiddenItems.map((item, index) => (
                <DropdownMenuItem key={index} asChild={!!item.href || !!item.onClick}>
                  {item.href ? (
                    <Link to={item.href} className="flex items-center">
                      {item.icon && <span className="mr-2">{item.icon}</span>}
                      {item.label}
                    </Link>
                  ) : item.onClick ? (
                    <button
                      onClick={item.onClick}
                      className="flex items-center w-full"
                      type="button"
                    >
                      {item.icon && <span className="mr-2">{item.icon}</span>}
                      {item.label}
                    </button>
                  ) : (
                    <span className="flex items-center">
                      {item.icon && <span className="mr-2">{item.icon}</span>}
                      {item.label}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
      </>
    );
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {displayItems.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === displayItems.length - 1;
          const showEllipsis = shouldTruncate && isFirst;

          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>{renderItem(item, isLast)}</BreadcrumbItem>
              
              {showEllipsis && renderEllipsis()}
              
              {!isLast && !showEllipsis && (
                <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
              )}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
