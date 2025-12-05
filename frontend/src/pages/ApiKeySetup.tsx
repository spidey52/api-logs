import { Key as KeyIcon } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { setApiKey } from "../store/appStore";

export default function ApiKeySetup() {
 const navigate = useNavigate();
 const [apiKeyInput, setApiKeyInput] = useState("");
 const [environment, setEnvironment] = useState<"dev" | "production">("dev");
 const [error, setError] = useState("");

 const handleApiKeyChange = (value: string) => {
  setApiKeyInput(value);

  // Auto-detect environment from API key prefix
  if (value.startsWith("dev_")) {
   setEnvironment("dev");
  } else if (value.startsWith("prod_")) {
   setEnvironment("production");
  }
 };

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (!apiKeyInput.trim()) {
   setError("API Key is required");
   return;
  }

  // Validate API key format (optional)
  if (apiKeyInput.length < 10) {
   setError("Invalid API Key format");
   return;
  }

  // Store in store (which also updates localStorage)
  setApiKey(apiKeyInput, environment);

  // Navigate to dashboard
  navigate({ to: "/" });
 };

 return (
  <Box
   sx={{
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    bgcolor: "background.default",
    p: 2,
   }}
  >
   <Card sx={{ maxWidth: 500, width: "100%" }}>
    <CardContent sx={{ p: 4 }}>
     <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
      <KeyIcon sx={{ fontSize: 40, color: "primary.main" }} />
      <Typography variant='h4' component='h1'>
       API Key Setup
      </Typography>
     </Box>

     <Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
      Enter your API key to start logging and monitoring your API requests.
     </Typography>

     {error && (
      <Alert severity='error' sx={{ mb: 3 }}>
       {error}
      </Alert>
     )}

     <form onSubmit={handleSubmit}>
      <TextField
       fullWidth
       label='API Key'
       placeholder='prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
       value={apiKeyInput}
       onChange={(e) => handleApiKeyChange(e.target.value)}
       required
       sx={{ mb: 3 }}
       autoFocus
      />

      <FormControl component='fieldset' sx={{ mb: 4 }}>
       <FormLabel component='legend'>Environment</FormLabel>
       <RadioGroup row value={environment} onChange={(e) => setEnvironment(e.target.value as "dev" | "production")}>
        <FormControlLabel value='dev' control={<Radio />} label='Development' />
        <FormControlLabel value='production' control={<Radio />} label='Production' />
       </RadioGroup>
      </FormControl>

      <Button type='submit' variant='contained' size='large' fullWidth>
       Continue to Dashboard
      </Button>
     </form>

     <Box sx={{ mt: 3, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
      <Typography variant='caption' color='text.secondary'>
       <strong>Note:</strong> Your API key is stored locally in your browser and is never sent to any third-party servers.
      </Typography>
     </Box>
    </CardContent>
   </Card>
  </Box>
 );
}
