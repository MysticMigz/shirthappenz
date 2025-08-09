import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/backend/utils/database';
import CategoryVisibility from '@/backend/models/CategoryVisibility';
import User from '@/backend/models/User';

// Get all category visibility settings
export async function GET(request: NextRequest) {
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
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Get all category visibility settings
    const categories = await CategoryVisibility.find()
      .sort({ sortOrder: 1, category: 1 });
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching category visibility:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category visibility settings' },
      { status: 500 }
    );
  }
}

// Create or update category visibility settings
export async function POST(request: NextRequest) {
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
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { category, isVisible, displayName, description, sortOrder, genderVisibility } = body;
    
    // Validate required fields
    if (!category || !displayName) {
      return NextResponse.json(
        { error: 'Category and display name are required' },
        { status: 400 }
      );
    }
    
    // Check if category already exists
    let categoryDoc = await CategoryVisibility.findOne({ category });
    
    if (categoryDoc) {
      // Update existing category
      categoryDoc.isVisible = isVisible ?? categoryDoc.isVisible;
      categoryDoc.displayName = displayName;
      categoryDoc.description = description ?? categoryDoc.description;
      categoryDoc.sortOrder = sortOrder ?? categoryDoc.sortOrder;
      categoryDoc.genderVisibility = genderVisibility ?? categoryDoc.genderVisibility;
      categoryDoc.updatedBy = session.user.email;
      categoryDoc.updatedAt = new Date();
      
      await categoryDoc.save();
    } else {
      // Create new category
      categoryDoc = new CategoryVisibility({
        category,
        isVisible: isVisible ?? true,
        displayName,
        description: description ?? '',
        sortOrder: sortOrder ?? 0,
        genderVisibility: genderVisibility ?? {
          men: true,
          women: true,
          unisex: true,
          kids: true
        },
        updatedBy: session.user.email
      });
      
      await categoryDoc.save();
    }
    
    return NextResponse.json({ 
      message: 'Category visibility updated successfully',
      category: categoryDoc 
    });
  } catch (error) {
    console.error('Error updating category visibility:', error);
    return NextResponse.json(
      { error: 'Failed to update category visibility' },
      { status: 500 }
    );
  }
}

// Bulk update category visibility
export async function PATCH(request: NextRequest) {
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
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { updates } = body;
    
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 }
      );
    }
    
    const results = [];
    
    for (const update of updates) {
      const { category, isVisible, displayName, description, sortOrder, genderVisibility } = update;
      
      if (!category) {
        results.push({ category, success: false, error: 'Category is required' });
        continue;
      }
      
      try {
        const categoryDoc = await CategoryVisibility.findOne({ category });
        
        if (categoryDoc) {
          if (isVisible !== undefined) categoryDoc.isVisible = isVisible;
          if (displayName !== undefined) categoryDoc.displayName = displayName;
          if (description !== undefined) categoryDoc.description = description;
          if (sortOrder !== undefined) categoryDoc.sortOrder = sortOrder;
          if (genderVisibility !== undefined) categoryDoc.genderVisibility = genderVisibility;
          
          categoryDoc.updatedBy = session.user.email;
          categoryDoc.updatedAt = new Date();
          
          await categoryDoc.save();
          results.push({ category, success: true });
        } else {
          results.push({ category, success: false, error: 'Category not found' });
        }
      } catch (error) {
        results.push({ category, success: false, error: error.message });
      }
    }
    
    return NextResponse.json({ 
      message: 'Bulk update completed',
      results 
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk update' },
      { status: 500 }
    );
  }
}
