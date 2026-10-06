const { User, sequelize } = require('../models');

async function main() {
  try {
    const email = process.argv[2]?.trim().toLowerCase();
    if (!email) throw new Error('Usage: npm run user:admin -- registered@example.com');
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error('Register this user through /auth/register first');
    await user.update({ role: 'admin' });
    console.log(`Administrator role assigned to ${user.email}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
