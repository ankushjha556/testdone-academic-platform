import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Resetting Admin Password...');
    const password = 'Admin@TestDone123';
    const hash = await bcrypt.hash(password, 12);

    try {
        await prisma.user.update({
            where: { email: 'admin@testdone.in' },
            data: {
                passwordHash: hash,
                role: 'SUPER_ADMIN', // Ensure role is correct too
                isEmailVerified: true
            }
        });
        console.log('✅ Admin password updated to: ' + password);
    } catch (error) {
        console.error('Failed to update admin:', error);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
