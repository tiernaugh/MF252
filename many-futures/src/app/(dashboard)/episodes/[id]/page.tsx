"use client";

import { useState } from "react";
import Link from "next/link";
import { mockEpisodes, mockProjects } from "~/lib/mock-data";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, Clock, Calendar, Star } from "lucide-react";
import { notFound } from "next/navigation";

export default function EpisodePage({ params }: { params: { id: string } }) {
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const episode = mockEpisodes.find(e => e.id === params.id);
  
  if (!episode) {
    notFound();
  }

  const project = mockProjects.find(p => p.id === episode.projectId);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const handleSubmitFeedback = () => {
    console.log("Feedback submitted:", { rating, feedbackText });
    setFeedbackSubmitted(true);
  };

  // Convert markdown to basic HTML (in production, use a proper markdown renderer)
  const renderContent = (content: string) => {
    // This is a simple conversion for demo - use react-markdown or similar in production
    return content
      .split('\n\n')
      .map((paragraph, i) => {
        if (paragraph.startsWith('#')) {
          const level = paragraph.match(/^#+/)?.[0].length || 1;
          const text = paragraph.replace(/^#+\s/, '');
          const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
          return <HeadingTag key={i} className={`font-bold ${
            level === 1 ? 'text-3xl mt-8 mb-4' : 
            level === 2 ? 'text-2xl mt-6 mb-3' : 
            'text-xl mt-4 mb-2'
          }`}>{text}</HeadingTag>;
        }
        if (paragraph.startsWith('**')) {
          return <p key={i} className="font-semibold">{paragraph.replace(/\*\*/g, '')}</p>;
        }
        if (paragraph.trim()) {
          return <p key={i} className="text-stone-700 leading-relaxed">{paragraph}</p>;
        }
        return null;
      });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="mb-8">
        <Link href="/projects">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to projects
          </Button>
        </Link>
        
        {/* Breadcrumb */}
        <div className="text-sm text-stone-600">
          <Link href="/projects" className="hover:text-stone-900">Projects</Link>
          {' / '}
          <Link href={`/projects/${project?.id}`} className="hover:text-stone-900">
            {project?.title}
          </Link>
          {' / '}
          <span className="text-stone-900">Episode {episode.sequence}</span>
        </div>
      </div>

      {/* Episode Header */}
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <Badge variant="outline">Episode {episode.sequence}</Badge>
          <div className="flex items-center text-sm text-stone-600">
            <Clock className="w-4 h-4 mr-1" />
            {episode.readingMinutes} min read
          </div>
          <div className="flex items-center text-sm text-stone-600">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(episode.publishedAt)}
          </div>
        </div>
        
        <h1 className="text-4xl font-serif font-bold text-stone-900 mb-4">
          {episode.title}
        </h1>
        
        <p className="text-xl text-stone-600 leading-relaxed">
          {episode.summary}
        </p>
        
        {episode.highlightQuote && (
          <blockquote className="mt-6 pl-6 border-l-4 border-stone-300 text-lg italic text-stone-700">
            "{episode.highlightQuote}"
          </blockquote>
        )}
      </header>

      {/* Episode Content */}
      <article className="prose prose-stone prose-lg max-w-none mb-16">
        <div className="space-y-4">
          {renderContent(episode.content)}
        </div>
      </article>

      {/* Feedback Section */}
      <Card className="mb-12">
        <CardContent className="p-8">
          {!feedbackSubmitted ? (
            <>
              <h3 className="text-lg font-semibold mb-4">
                How was this episode?
              </h3>
              
              {/* Rating */}
              <div className="flex gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRating(value)}
                    className={`p-3 rounded-lg border transition-all ${
                      rating === value 
                        ? 'bg-stone-900 text-white border-stone-900' 
                        : 'border-stone-300 hover:border-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${rating && rating >= value ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
              
              {/* Feedback text */}
              <textarea
                placeholder="Any specific feedback? What would you like to see more or less of? (optional)"
                className="w-full p-4 border border-stone-300 rounded-lg mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-stone-500"
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
              
              <Button 
                onClick={handleSubmitFeedback}
                disabled={!rating}
                className="bg-stone-900 hover:bg-stone-800"
              >
                Submit Feedback
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-stone-600 mb-2">Thanks for your feedback!</p>
              <p className="text-sm text-stone-500">
                It helps Futura create better episodes for you.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Episode Teaser */}
      {project && !project.isPaused && (
        <div className="border-t pt-8">
          <p className="text-sm text-stone-600">
            Next episode arrives {formatDate(project.nextScheduledAt)}
          </p>
        </div>
      )}
    </div>
  );
}