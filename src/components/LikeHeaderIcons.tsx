/**
 * Header icons from `public/Icon/` (Figma). Inline SVGs so theme colors work.
 */

export function IconHeaderBack({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M15 18L9 12L15 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconEllipsisVertical({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M12 2.5C13.1046 2.5 14 3.39543 14 4.5C14 5.60457 13.1046 6.5 12 6.5C10.8954 6.5 10 5.60457 10 4.5C10 3.39543 10.8954 2.5 12 2.5ZM12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10ZM12 17.5C13.1046 17.5 14 18.3954 14 19.5C14 20.6046 13.1046 21.5 12 21.5C10.8954 21.5 10 20.6046 10 19.5C10 18.3954 10.8954 17.5 12 17.5Z"
        fill={color}
      />
    </svg>
  );
}

export function IconArrowTurnUpRight({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M10.839 1.58837C11.1975 1.42675 11.6175 1.49027 11.9122 1.75069L22.6622 11.2507C22.8787 11.442 23.0019 11.7177 23 12.0066C22.9981 12.2956 22.8713 12.5696 22.6522 12.758L11.9022 22.008C11.606 22.263 11.1883 22.3219 10.833 22.1589C10.4777 21.9959 10.25 21.6409 10.25 21.25V16.2653C7.409 16.4069 4.2739 17.1403 2.20711 19.2071C1.92111 19.4931 1.49099 19.5787 1.11732 19.4239C0.743642 19.2691 0.5 18.9045 0.5 18.5C0.5 12.6587 4.35091 7.97625 10.25 7.52805V2.50002C10.25 2.10675 10.4805 1.74999 10.839 1.58837ZM12.25 15.25V19.0703L20.4785 11.99L12.25 4.71827V8.50002C12.25 8.76957 12.1412 9.0277 11.9482 9.21591C11.7552 9.40411 11.4945 9.50644 11.225 9.4997C7.02093 9.3946 3.41358 12.1697 2.67976 16.3287C4.91542 14.9801 7.58135 14.3931 10.17 14.2668C10.5082 14.2503 10.7823 14.2461 10.9746 14.2461C11.5638 14.2461 12.25 14.3733 12.25 15.25Z"
        fill={color}
      />
    </svg>
  );
}

export function IconPlusSmall({
  circleFill,
  plusColor,
  size = 24,
}: {
  circleFill: string;
  plusColor: string;
  size?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="24" height="24" rx="12" fill={circleFill} />
      <path
        d="M13.1667 6.33333C13.1667 6.14924 13.0174 6 12.8333 6H11.6667C11 6 10.8333 6.14924 10.8333 6.33333V10.8333H6.33333C6.14924 10.8333 6 10.9826 6 11.1667V12.8333C6 13.0174 6.14924 13.1667 6.33333 13.1667H10.8333V17.6667C10.8333 17.8508 10.9826 18 11.6667 18H12.8333C13.0174 18 13.1667 17.8508 13.1667 17.6667V13.1667H17.6667C17.8508 13.1667 18 13.0174 18 12.8333V11.1667C18 10.9826 17.8508 10.8333 17.6667 10.8333H13.1667V6.33333Z"
        fill={plusColor}
      />
    </svg>
  );
}
