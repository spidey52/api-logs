import { Chip } from "@mui/material";

type ChipColor = "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";

export const formatters = {
 date: (value: string) => new Date(value).toLocaleDateString(),
 dateTime: (value: string) => new Date(value).toLocaleString(),
 badge: (value: string, color?: ChipColor) => <Chip label={value} size='small' color={color} />,
 statusBadge: (value: number) => {
  if (value >= 200 && value < 300) return <Chip label={value} size='small' color='success' />;
  if (value >= 300 && value < 400) return <Chip label={value} size='small' color='info' />;
  if (value >= 400 && value < 500) return <Chip label={value} size='small' color='warning' />;
  if (value >= 500) return <Chip label={value} size='small' color='error' />;
  return <Chip label={value} size='small' />;
 },
 duration: (value: number) => `${value}ms`,
 truncate: (value: string, length = 50) => (value?.length > length ? `${value.substring(0, length)}...` : value),
};
