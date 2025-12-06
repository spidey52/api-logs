import { Skeleton, TableCell } from "@mui/material";
import type { DensityType } from "./types";
import { getCellPadding } from "./utils";

interface DataTableSkeletonRowProps {
 columnCount: number;
 hasActions: boolean;
 density: DensityType;
}

export default function DataTableSkeletonRow({ columnCount, hasActions, density }: DataTableSkeletonRowProps) {
 return (
  <>
   {Array.from({ length: columnCount }).map((_, index) => (
    <TableCell key={index} sx={{ padding: getCellPadding(density) }}>
     <Skeleton animation='wave' />
    </TableCell>
   ))}
   {hasActions && (
    <TableCell sx={{ padding: getCellPadding(density) }}>
     <Skeleton animation='wave' />
    </TableCell>
   )}
   <TableCell />
  </>
 );
}
