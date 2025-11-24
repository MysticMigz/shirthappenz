import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/backend/utils/database';
import DesignPreset from '@/backend/models/DesignPreset';
import User from '@/backend/models/User';

// Delete a design preset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Verify admin status
    const user = await (User as any).findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Handle both sync and async params (Next.js 13/14 vs 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Preset ID is required' },
        { status: 400 }
      );
    }
    
    const preset = await (DesignPreset as any).findByIdAndDelete(id);
    
    if (!preset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Preset deleted successfully' });
  } catch (error) {
    console.error('Error deleting design preset:', error);
    return NextResponse.json(
      { error: 'Failed to delete design preset' },
      { status: 500 }
    );
  }
}

