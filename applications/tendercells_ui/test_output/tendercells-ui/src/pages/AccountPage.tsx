import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import { Devices } from '@mui/icons-material';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/products/ProductCard';
import ProductRegistrationModal from '../components/products/ProductRegistrationModal';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState(0);
  const { products, loading, refetch, registerProduct } = useProducts();
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRegister = async (data: any) => {
    await registerProduct(data);
    await refetch();
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Profile" />
          <Tab label="Security" />
          <Tab label="Products" icon={<Devices/>} iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Typography variant="h5" gutterBottom>
          Account Profile
        </Typography>
        <TextField label="Email" fullWidth margin="normal" />
        <TextField label="Password" fullWidth margin="normal" type="password" />
        <Button variant="contained" color="primary" sx={{ mt: 2 }}>
          Update Account
        </Button>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Typography variant="h5" gutterBottom>
          Security Settings
        </Typography>
        <TextField label="Current Password" fullWidth margin="normal" type="password" />
        <TextField label="New Password" fullWidth margin="normal" type="password" />
        <TextField label="Confirm New Password" fullWidth margin="normal" type="password" />
        <Button variant="contained" color="primary" sx={{ mt: 2 }}>
          Change Password
        </Button>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Registered Products
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your hardware units and automation devices
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => setIsRegistrationModalOpen(true)}
          >
            Register Product
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography>Loading products...</Typography>
          </Box>
        ) : products.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Devices sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No products registered
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Get started by registering your first product
            </Typography>
            <Button
              variant="contained"
              onClick={() => setIsRegistrationModalOpen(true)}
            >
              Register Product
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onUpdate={() => refetch()}
              />
            ))}
          </Box>
        )}

        <ProductRegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={() => setIsRegistrationModalOpen(false)}
          onRegister={handleRegister}
        />
      </TabPanel>
    </Box>
  );
}
