import { useQuery } from "@tanstack/react-query";
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from "@mui/material";
import { usersApi } from "../lib/api";

export default function UsersPage() {
 const { data, isLoading } = useQuery({
  queryKey: ["users"],
  queryFn: () => usersApi.getAll().then((res) => res.data),
 });

 if (isLoading) {
  return (
   <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
    <CircularProgress />
   </Box>
  );
 }

 return (
  <Box>
   <Typography variant='h4' gutterBottom>
    Users
   </Typography>

   <TableContainer component={Paper}>
    <Table>
     <TableHead>
      <TableRow>
       <TableCell>Name</TableCell>
       <TableCell>Identifier</TableCell>
       <TableCell>Email</TableCell>
       <TableCell>Created At</TableCell>
      </TableRow>
     </TableHead>
     <TableBody>
      {data?.data.map((user) => (
       <TableRow key={user.id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.identifier}</TableCell>
        <TableCell>{user.email || "-"}</TableCell>
        <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
       </TableRow>
      ))}
     </TableBody>
    </Table>
   </TableContainer>
  </Box>
 );
}
