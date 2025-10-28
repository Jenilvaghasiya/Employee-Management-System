const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const {sequelize} = require('./config/db.js');
const departmentRoutes = require('./routes/departmentRoutes');
const designationRoutes = require("./routes/designationRoutes");
const leaveTypeRoutes = require("./routes/leaveTypeRoutes");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/departments',departmentRoutes);
app.use('/api/designations',designationRoutes);
app.use('/api/leave-types',leaveTypeRoutes);

sequelize.sync()
    .then(() => console.log('Database synchronized.'))
    .catch(err => console.error('Sync error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
