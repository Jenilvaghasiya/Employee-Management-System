const { DataTypes } = require("sequelize");
const {sequelize} = require("../config/db");
const Department = require("./department");
const Designation = require("./designation");

const Employee = sequelize.define("Employee", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Department,
      key: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  designation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Designation,
      key: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  reporting_head_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // self reference
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: "employees",
  timestamps: true,
});

// ✅ Associations
Department.hasMany(Employee, {
  foreignKey: "department_id",
  as: "employees",
});

Designation.hasMany(Employee, {
  foreignKey: "designation_id",
  as: "employees",
});

Employee.belongsTo(Department, {
  foreignKey: "department_id",
  as: "department",
});

Employee.belongsTo(Designation, {
  foreignKey: "designation_id",
  as: "designation",
});

// Self-referencing relationship for reporting head
Employee.belongsTo(Employee, {
  foreignKey: "reporting_head_id",
  as: "reporting_head",
});

Employee.hasMany(Employee, {
  foreignKey: "reporting_head_id",
  as: "team_members",
});

module.exports = Employee;
