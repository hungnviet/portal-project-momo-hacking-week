import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface AddCommentRequest {
  time: string;
  userDomain: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: 'projectId is required',
        data: null
      }, { status: 400 });
    }

    const body: AddCommentRequest = await request.json();
    const { time, userDomain, content } = body;

    if (!userDomain || !content) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: 'userDomain and content are required',
        data: null
      }, { status: 400 });
    }

    // Validate project exists
    const { data: project, error: projectError } = await supabase
      .from('Project')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'NOT_FOUND',
        message: 'Project not found',
        data: null
      }, { status: 404 });
    }

    // Prepare comment data
    const commentData = {
      projectid: parseInt(projectId),
      comment: content.trim(),
      user: userDomain,
      created_at: time || new Date().toISOString()
    };

    // Insert comment
    const { data: insertedComment, error: insertError } = await supabase
      .from('Comment')
      .insert(commentData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting comment:', insertError);
      return NextResponse.json({
        status: 'error',
        errorCode: 'DB_ERROR',
        message: 'Failed to add comment',
        data: null
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      errorCode: null,
      message: 'Comment added successfully',
      data: {
        commentId: insertedComment.id,
        projectId: insertedComment.projectid,
        content: insertedComment.comment,
        user: insertedComment.user,
        createdAt: insertedComment.created_at
      }
    });

  } catch (error) {
    console.error('Error in POST /api/comment:', error);
    return NextResponse.json({
      status: 'error',
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error',
      data: null
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: 'projectId is required',
        data: null
      }, { status: 400 });
    }

    // Get comments for the project
    const { data: comments, error: commentsError } = await supabase
      .from('Comment')
      .select('*')
      .eq('projectid', projectId)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return NextResponse.json({
        status: 'error',
        errorCode: 'DB_ERROR',
        message: 'Failed to fetch comments',
        data: null
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      errorCode: null,
      message: 'Comments retrieved successfully',
      data: comments || []
    });

  } catch (error) {
    console.error('Error in GET /api/comment:', error);
    return NextResponse.json({
      status: 'error',
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error',
      data: null
    }, { status: 500 });
  }
}
