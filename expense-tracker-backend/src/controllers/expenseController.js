const Expense = require('../models/expense');

exports.getExpenses = async (req, res) => {
  const expenses = await Expense.find({ user: req.userId }).sort({ date: -1 });
  res.json(expenses);
};

exports.addExpense = async (req, res) => {
  const expense = new Expense({ ...req.body, user: req.userId });
  await expense.save();
  res.status(201).json(expense);
};

// Similarly update updateExpense and deleteExpense to check ownership
